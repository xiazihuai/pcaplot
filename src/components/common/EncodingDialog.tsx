// 编码选择弹窗 — 当自动编码检测不确定时手动选择
import { useState, useCallback } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useDataStore } from '../../stores/useDataStore';
import './EncodingDialog.css';

const COMMON_ENCODINGS = [
  { value: 'UTF-8', label: 'UTF-8 (推荐)', description: '通用 Unicode 编码' },
  { value: 'GBK', label: 'GBK', description: '简体中文编码 (Windows)' },
  { value: 'GB2312', label: 'GB2312', description: '简体中文旧版编码' },
  { value: 'UTF-16BE', label: 'UTF-16 BE', description: 'Unicode 大端序' },
  { value: 'UTF-16LE', label: 'UTF-16 LE', description: 'Unicode 小端序' },
  { value: 'ISO-8859-1', label: 'ISO-8859-1 (Latin-1)', description: '西欧语言编码' },
  { value: 'Shift_JIS', label: 'Shift-JIS', description: '日文编码' },
  { value: 'EUC-KR', label: 'EUC-KR', description: '韩文编码' },
];

export default function EncodingDialog() {
  const isOpen = useUIStore(s => s.isEncodingDialogOpen);
  const file = useUIStore(s => s.encodingDialogFile);
  const closeDialog = useUIStore(s => s.closeEncodingDialog);
  const importFile = useDataStore(s => s.importFile);
  const showToast = useUIStore(s => s.showToast);

  const [selectedEncoding, setSelectedEncoding] = useState('GBK');
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    try {
      await importFile(file, selectedEncoding);
      showToast(`已使用 ${selectedEncoding} 编码导入: ${file.name}`, 'info');
      closeDialog();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      showToast(`导入失败: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [file, selectedEncoding, importFile, showToast, closeDialog]);

  const handleCancel = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={handleCancel}>
      <div className="dialog-box encoding-dialog" onClick={e => e.stopPropagation()}>
        <h3>选择文件编码</h3>
        <p className="dialog-desc">
          自动编码检测不确定，请手动选择编码格式。
          {file && <><br/>文件: <strong>{file.name}</strong></>}
        </p>

        <div className="encoding-list">
          {COMMON_ENCODINGS.map(enc => (
            <label
              key={enc.value}
              className={`encoding-option ${selectedEncoding === enc.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="encoding"
                value={enc.value}
                checked={selectedEncoding === enc.value}
                onChange={() => setSelectedEncoding(enc.value)}
              />
              <span className="encoding-label">{enc.label}</span>
              <span className="encoding-desc">{enc.description}</span>
            </label>
          ))}
        </div>

        <div className="dialog-actions">
          <button className="toolbar-btn" onClick={handleCancel} disabled={loading}>
            取消
          </button>
          <button className="toolbar-btn primary" onClick={handleConfirm} disabled={loading}>
            {loading ? '导入中...' : '确认导入'}
          </button>
        </div>
      </div>
    </div>
  );
}
