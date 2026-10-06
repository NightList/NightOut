# NightOut

แพลตฟอร์มจองโต๊ะร้านกลางคืน บัญชีผู้ใช้ถือความสามารถได้ชั้นเดียว และตำแหน่งในร้านกับชื่อบนหน้าทีมเป็นคนละเรื่อง

## Language

**User Account**:
บัญชีของคนที่เข้าสู่ระบบ NightOut ได้หนึ่งคน
_Avoid_: User, profile

**Account Role**:
ชั้นความสามารถเดียวที่ User Account ถืออยู่ แหล่งความจริงคือรายการ Role ที่บัญชีชี้อยู่
_Avoid_: role (เมื่อหมายถึงตำแหน่งในร้านหรือชื่อบนหน้าทีม), user_role

**Customer**:
Account Role ของคนที่มาจองโต๊ะ
_Avoid_: guest, member

**Merchant**:
Account Role ของคนที่ดูแลร้านในนามเจ้าของหรือผู้จัดการ
_Avoid_: bar owner, vendor

**Staff**:
Account Role ของพนักงานหน้าร้าน ที่ทำได้เฉพาะงานของคืนนั้น
_Avoid_: Bar Staff Role

**Admin**:
Account Role ของทีม NightOut ที่ทำงานในหลังบ้านได้ และเปลี่ยน Account Role ของบัญชีอื่นไม่ได้
_Avoid_: backoffice user

**Super Admin**:
Account Role ที่ทำได้ทุกอย่างที่ Admin ทำได้ และเป็นชั้นเดียวที่เปลี่ยน Account Role ของบัญชีที่มีอยู่แล้วได้
_Avoid_: root, owner

**Bar Staff Role**:
ตำแหน่งของคนคนหนึ่งในร้านหนึ่งร้าน เป็นเจ้าของ ผู้จัดการ หรือพนักงาน
_Avoid_: Account Role, Staff

**Team Title**:
ชื่อตำแหน่งที่โชว์บนหน้าทีมสาธารณะ ไม่ได้ให้สิทธิ์ในระบบ
_Avoid_: Account Role, roles
