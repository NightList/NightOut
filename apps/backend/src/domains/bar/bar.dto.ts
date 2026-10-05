import * as C from '@nightout/contracts';
import { createZodDto } from 'nestjs-zod';

export class MerchantJoinDto extends createZodDto(C.MerchantJoinBody) {}
export class BarInfoDto extends createZodDto(C.BarInfoBody) {}
export class MenuDto extends createZodDto(C.MenuBody) {}
export class BarPromotionsDto extends createZodDto(C.BarPromotionsBody) {}
export class FeesDto extends createZodDto(C.FeesBody) {}
export class ZonesDto extends createZodDto(C.ZonesBody) {}
export class SafetyDto extends createZodDto(C.SafetyBody) {}
export class EvidenceDto extends createZodDto(C.EvidenceBody) {}
export class BookingSettingsDto extends createZodDto(C.BookingSettingsBody) {}
export class PayoutAccountDto extends createZodDto(C.PayoutAccountBody) {}
export class CrowdDto extends createZodDto(C.CrowdBody) {}
export class SetBarStatusDto extends createZodDto(C.SetBarStatusBody) {}
export class SetEditorPickDto extends createZodDto(C.SetEditorPickBody) {}
export class ApproveDto extends createZodDto(C.ApproveBody) {}
