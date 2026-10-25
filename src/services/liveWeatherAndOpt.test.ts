import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LARIKREJO_COORDS,
  degreesToCardinalId,
  evaluateAgronomyWeatherAdvisory,
  formatDynamicForecastDateId,
  parseOpenMeteoResponseToSnapshot,
  translateWmoWeatherCode,
} from './liveWeatherService';
import {
  calculateBestSprayingWindow,
  generateRealTimeEpidemiologyOptAlerts,
} from '../utils/epidemiologyOptEngine';

describe('liveWeatherService & epidemiologyOptEngine pure logic tests', () => {
  it('translates WMO weather codes accurately into Indonesian with day/night support', () => {
    assert.equal(translateWmoWeatherCode(0, true).label, 'Cerah');
    assert.equal(translateWmoWeatherCode(0, false).label, 'Cerah Malam');
    assert.equal(translateWmoWeatherCode(2, true).label, 'Cerah Berawan');
    assert.equal(translateWmoWeatherCode(3, true).label, 'Berawan');
    assert.equal(translateWmoWeatherCode(61, true).label, 'Hujan Ringan');
    assert.equal(translateWmoWeatherCode(63, true).label, 'Hujan Sedang');
    assert.equal(translateWmoWeatherCode(65, true).label, 'Hujan Lebat');
    assert.equal(translateWmoWeatherCode(95, true).label, 'Hujan Lebat Disertai Petir');
  });

  it('converts wind degrees to Indonesian cardinal directions', () => {
    assert.equal(degreesToCardinalId(0), 'Utara');
    assert.equal(degreesToCardinalId(90), 'Timur');
    assert.equal(degreesToCardinalId(135), 'Tenggara');
    assert.equal(degreesToCardinalId(270), 'Barat');
  });

  it('formats dynamic forecast dates in Indonesian using Intl.DateTimeFormat', () => {
    const day0 = formatDynamicForecastDateId('2026-05-04', 0);
    assert.equal(day0.dateStr, 'Hari Ini');
    assert.ok(day0.formattedDate.length >= 6);

    const day1 = formatDynamicForecastDateId('2026-05-05', 1);
    assert.equal(day1.dateStr, 'Besok');
  });

  it('evaluates agronomic spraying & fertilizing advisory accurately based on rain probability, rainfall, and wind speed', () => {
    // High rain probability (86%) -> must be Kurang Kondusif / Tunda Penyemprotan & Pemupukan
    const rainyAdv = evaluateAgronomyWeatherAdvisory({
      tempC: 28,
      humidityPct: 84,
      rainfallMm: 0.5,
      rainProbabilityPct: 86,
      windSpeedKmh: 10,
      weatherCode: 2,
    });
    assert.equal(rainyAdv.isCondusive, false);
    assert.equal(rainyAdv.status, 'Kurang Kondusif / Tunda Penyemprotan & Pemupukan');

    // High wind speed (18 km/h > 15 km/h) -> must be Kurang Kondusif
    const windyAdv = evaluateAgronomyWeatherAdvisory({
      tempC: 29,
      humidityPct: 72,
      rainfallMm: 0,
      rainProbabilityPct: 20,
      windSpeedKmh: 18,
      weatherCode: 1,
    });
    assert.equal(windyAdv.isCondusive, false);
    assert.equal(windyAdv.status, 'Kurang Kondusif / Tunda Penyemprotan & Pemupukan');

    // Safe weather (rainProb 25%, rain 0mm, wind 11 km/h) -> Kondusif untuk Pemupukan & Penyemprotan PHT
    const safeAdv = evaluateAgronomyWeatherAdvisory({
      tempC: 29,
      humidityPct: 76,
      rainfallMm: 0,
      rainProbabilityPct: 25,
      windSpeedKmh: 11,
      weatherCode: 2,
    });
    assert.equal(safeAdv.isCondusive, true);
    assert.equal(safeAdv.status, 'Kondusif untuk Pemupukan & Penyemprotan PHT');
  });

  it('parses Open-Meteo API payload into a complete WeatherSnapshot with 7-day dynamic forecast', () => {
    const sampleRaw = {
      current: {
        temperature_2m: 27.6,
        apparent_temperature: 31.2,
        relative_humidity_2m: 85,
        is_day: 1,
        precipitation: 0.2,
        rain: 0.2,
        weather_code: 2,
        wind_speed_10m: 11.4,
        wind_direction_10m: 110,
      },
      daily: {
        time: [
          '2026-05-01',
          '2026-05-02',
          '2026-05-03',
          '2026-05-04',
          '2026-05-05',
          '2026-05-06',
          '2026-05-07',
        ],
        weather_code: [2, 3, 61, 63, 2, 1, 2],
        temperature_2m_max: [32, 31, 29, 29, 32, 33, 32],
        temperature_2m_min: [24, 24, 23, 23, 24, 25, 24],
        precipitation_sum: [0.5, 1.2, 8.4, 14.0, 1.0, 0.0, 0.4],
        precipitation_probability_max: [30, 45, 75, 85, 35, 15, 25],
        wind_speed_10m_max: [12, 14, 17, 19, 13, 11, 12],
      },
    };

    const snap = parseOpenMeteoResponseToSnapshot({
      raw: sampleRaw,
      latitude: DEFAULT_LARIKREJO_COORDS.latitude,
      longitude: DEFAULT_LARIKREJO_COORDS.longitude,
      locationName: DEFAULT_LARIKREJO_COORDS.locationName,
      locationSource: 'Koordinat Presisi Desa Larikrejo, Kudus',
      bmkgAdm4Code: DEFAULT_LARIKREJO_COORDS.bmkgAdm4Code,
      providerMode: 'bmkg-hybrid',
    });

    assert.equal(snap.tempC, 28);
    assert.equal(snap.humidityPct, 85);
    assert.equal(snap.forecast.length, 7);
    assert.ok(snap.forecast[0].formattedDate);
    assert.equal(snap.sprayingAdvisory.isCondusive, true);
  });

  it('generates real-time epidemiological OPT alerts with all 6 comprehensive farmer solution sections', () => {
    const sampleWeather = parseOpenMeteoResponseToSnapshot({
      raw: {
        current: {
          temperature_2m: 26.5,
          relative_humidity_2m: 86,
          precipitation: 3.5,
          weather_code: 61,
          wind_speed_10m: 17,
        },
        daily: {
          time: ['2026-05-01'],
          weather_code: [61],
          temperature_2m_max: [30],
          temperature_2m_min: [24],
          precipitation_sum: [6],
          precipitation_probability_max: [75],
          wind_speed_10m_max: [18],
        },
      },
      latitude: DEFAULT_LARIKREJO_COORDS.latitude,
      longitude: DEFAULT_LARIKREJO_COORDS.longitude,
      locationName: DEFAULT_LARIKREJO_COORDS.locationName,
      locationSource: 'Koordinat Presisi Desa Larikrejo, Kudus',
    });

    const alerts = generateRealTimeEpidemiologyOptAlerts({
      weather: sampleWeather,
      plantingSeasonMT: 'MT2 Gadu / Peralihan (Mar–Jun)',
      mainCommodity: 'Kacang Hijau',
    });

    assert.equal(alerts.length, 4);
    const blas = alerts.find((a) => a.id === 'opt-epid-blas-pelepah');
    const kresek = alerts.find((a) => a.id === 'opt-epid-kresek-hdb');
    assert.ok(blas);
    assert.ok(kresek);
    assert.equal(blas.riskLevel, 'Tinggi / Siaga');
    assert.equal(kresek.riskLevel, 'Tinggi / Siaga');

    for (const alert of alerts) {
      assert.ok(alert.whyItThreatensNow.length > 20);
      assert.ok(alert.earlyFieldSymptoms.length >= 3);
      assert.ok(alert.culturalPreventionSteps.length >= 3);
      assert.ok(alert.biologicalOrganicControl.length >= 2);
      assert.ok(alert.chemicalControlGuides.length >= 3);
      assert.ok(alert.chemicalControlGuides[0].dosagePer16LTank.includes('16 Liter'));
      assert.ok(alert.bestSprayingWindowToday.recommendedHours.length > 5);
    }

    const windowInfo = calculateBestSprayingWindow(sampleWeather);
    assert.ok(windowInfo.statusLabel.includes('Kurang Kondusif'));
  });
});
