import { Alert, Button } from 'antd';

/** โหลดข้อมูลไม่สำเร็จ — บอกเหตุผล + ปุ่มลองใหม่ */
export function LoadError({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  if (!error) return null;
  return (
    <Alert
      className="!mb-4"
      type="error"
      showIcon
      title="โหลดข้อมูลไม่สำเร็จ"
      description={error.message}
      action={
        <Button size="small" onClick={onRetry}>
          ลองใหม่
        </Button>
      }
    />
  );
}
