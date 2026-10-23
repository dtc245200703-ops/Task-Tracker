export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function ensure(condition, status, message) {
  if (!condition) throw new HttpError(status, message);
}
export function id(value) {
  const n = Number(value);
  ensure(Number.isSafeInteger(n) && n > 0, 400, 'Mã định danh không hợp lệ.');
  return n;
}
export function str(value, max, label) {
  ensure(typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max, 400, `${label} phải có từ 1 đến ${max} ký tự.`);
  return value.trim();
}
export function choice(value, allowed) {
  ensure(allowed.includes(value), 400, 'Giá trị lựa chọn không hợp lệ.'); return value;
}
export function date(value) {
  if (!value) return null;
  ensure(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 400, 'Ngày phải có dạng YYYY-MM-DD.');
  const d = new Date(value + 'T00:00:00Z');
  ensure(!Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === value && value >= '1000-01-01', 400, 'Ngày không tồn tại.');
  return value;
}
