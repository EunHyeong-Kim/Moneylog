/**
 * 한국 공휴일 데이터 (2024~2027)
 * 설날/추석 연휴 3일, 석가탄신일(음력), 대체공휴일 포함
 * 2023년 대체공휴일 확대 적용 법률 기준
 */

type HolidayEntry = { name: string; substitute?: boolean }
type YearHolidays = Record<string, HolidayEntry>

const HOLIDAY_DATA: Record<number, YearHolidays> = {
  2024: {
    '01-01': { name: '신정' },
    '02-09': { name: '설날 연휴' },
    '02-10': { name: '설날' },
    '02-11': { name: '설날 연휴' },
    '02-12': { name: '대체공휴일', substitute: true },
    '03-01': { name: '삼일절' },
    '05-05': { name: '어린이날' },
    '05-06': { name: '대체공휴일', substitute: true },
    '05-15': { name: '석가탄신일' },
    '06-06': { name: '현충일' },
    '08-15': { name: '광복절' },
    '09-16': { name: '추석 연휴' },
    '09-17': { name: '추석' },
    '09-18': { name: '추석 연휴' },
    '10-03': { name: '개천절' },
    '10-09': { name: '한글날' },
    '12-25': { name: '기독탄신일' },
  },
  2025: {
    '01-01': { name: '신정' },
    '01-28': { name: '설날 연휴' },
    '01-29': { name: '설날' },
    '01-30': { name: '설날 연휴' },
    '03-01': { name: '삼일절' },
    '03-03': { name: '대체공휴일', substitute: true },
    '05-05': { name: '어린이날·석가탄신일' },
    '05-06': { name: '대체공휴일', substitute: true },
    '06-06': { name: '현충일' },
    '08-15': { name: '광복절' },
    '10-03': { name: '개천절' },
    '10-05': { name: '추석 연휴' },
    '10-06': { name: '추석' },
    '10-07': { name: '추석 연휴' },
    '10-08': { name: '대체공휴일', substitute: true },
    '10-09': { name: '한글날' },
    '12-25': { name: '기독탄신일' },
  },
  2026: {
    '01-01': { name: '신정' },
    '02-16': { name: '설날 연휴' },
    '02-17': { name: '설날' },
    '02-18': { name: '설날 연휴' },
    '03-01': { name: '삼일절' },
    '03-02': { name: '대체공휴일', substitute: true },
    '05-05': { name: '어린이날' },
    '05-24': { name: '석가탄신일' },
    '05-25': { name: '대체공휴일', substitute: true },
    '06-06': { name: '현충일' },
    '08-15': { name: '광복절' },
    '08-17': { name: '대체공휴일', substitute: true },
    '09-24': { name: '추석 연휴' },
    '09-25': { name: '추석' },
    '09-26': { name: '추석 연휴' },
    '09-28': { name: '대체공휴일', substitute: true },
    '10-03': { name: '개천절' },
    '10-05': { name: '대체공휴일', substitute: true },
    '10-09': { name: '한글날' },
    '12-25': { name: '기독탄신일' },
  },
  2027: {
    '01-01': { name: '신정' },
    '02-05': { name: '설날 연휴' },
    '02-06': { name: '설날' },
    '02-07': { name: '설날 연휴' },
    '02-08': { name: '대체공휴일', substitute: true },
    '03-01': { name: '삼일절' },
    '05-05': { name: '어린이날' },
    '05-13': { name: '석가탄신일' },
    '06-06': { name: '현충일' },
    '08-15': { name: '광복절' },
    '08-16': { name: '대체공휴일', substitute: true },
    '09-14': { name: '추석 연휴' },
    '09-15': { name: '추석' },
    '09-16': { name: '추석 연휴' },
    '10-03': { name: '개천절' },
    '10-04': { name: '대체공휴일', substitute: true },
    '10-09': { name: '한글날' },
    '10-11': { name: '대체공휴일', substitute: true },
    '12-25': { name: '기독탄신일' },
    '12-27': { name: '대체공휴일', substitute: true },
  },
}

/** 연도에 해당하는 공휴일 Map을 반환. key: 'YYYY-MM-DD', value: 공휴일 이름 */
export function getKoreanHolidays(year: number): Map<string, string> {
  const map = new Map<string, string>()
  const data = HOLIDAY_DATA[year]
  if (data) {
    for (const [mmdd, entry] of Object.entries(data)) {
      map.set(`${year}-${mmdd}`, entry.name)
    }
  } else {
    // 데이터 없는 연도는 고정 양력 공휴일만 표시
    const fixed = [
      ['01-01', '신정'],
      ['03-01', '삼일절'],
      ['05-05', '어린이날'],
      ['06-06', '현충일'],
      ['08-15', '광복절'],
      ['10-03', '개천절'],
      ['10-09', '한글날'],
      ['12-25', '기독탄신일'],
    ]
    for (const [mmdd, name] of fixed) {
      map.set(`${year}-${mmdd}`, name)
    }
  }
  return map
}
