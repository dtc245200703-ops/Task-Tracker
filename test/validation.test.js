import test from 'node:test';
import assert from 'node:assert/strict';
import { id, date, str, choice } from '../src/validation.js';
test('Không chấp nhận mã âm, số lẻ hoặc chuỗi SQL',()=>{
  for(const value of [-1,0,1.5,'1 OR 1=1','abc'])assert.throws(()=>id(value));
  assert.equal(id('12'),12);
});
test('Ngày kiểm tra đúng năm nhuận và ngày không tồn tại',()=>{
  assert.equal(date('2028-02-29'),'2028-02-29');
  assert.equal(date(''),null);
  for(const value of ['2026-02-29','2026-04-31','2026-13-01','21/10/2026'])assert.throws(()=>date(value));
});
test('Giới hạn dữ liệu và lựa chọn trạng thái',()=>{
  assert.throws(()=>str('   ',100,'Tên'));
  assert.throws(()=>str('x'.repeat(201),200,'Tên'));
  assert.equal(str(' tên ',100,'Tên'),'tên');
  assert.throws(()=>choice('deleted',['todo','doing','done']));
});
