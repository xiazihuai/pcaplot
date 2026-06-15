// 信息面板 — 样本搜索 + 选中点详细信息 + 离群检测结果
import { useState, useMemo } from 'react';
import { useDataStore } from '../../stores/useDataStore';
import { useUIStore } from '../../stores/useUIStore';

export default function InfoPanel() {
  const selectedPoints = useUIStore(s => s.selectedPoints);
  const selectPoint = useUIStore(s => s.selectPoint);
  const clearSelection = useUIStore(s => s.clearSelection);
  const outlierDetailsExpanded = useUIStore(s => s.outlierDetailsExpanded);
  const setOutlierDetailsExpanded = useUIStore(s => s.setOutlierDetailsExpanded);
  const outlierResult = useDataStore(s => s.outlierResult);
  const groups = useDataStore(s => s.groups);
  const parsedRows = useDataStore(s => s.parsedRows);

  const [searchQuery, setSearchQuery] = useState('');

  // 搜索过滤
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || parsedRows.length === 0) return [];
    return parsedRows
      .filter(r => r.sampleName.toLowerCase().includes(q) || r.groupName.toLowerCase().includes(q))
      .slice(0, 50);
  }, [searchQuery, parsedRows]);

  const hasOutliers = outlierResult && outlierResult.candidates.length > 0;

  return (
    <div>
      {/* 样本搜索 */}
      {parsedRows.length > 0 && (
        <div className="sidebar-section">
          <h4>样本搜索</h4>
          <input
            type="text"
            placeholder="搜索样本名或分组..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '5px 8px', border: '1px solid #ddd',
              borderRadius: 4, fontSize: 12, outline: 'none',
            }}
          />
          {searchResults.length > 0 && (
            <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 4 }}>
              {searchResults.map(r => {
                const group = groups.find(g => g.name === r.groupName);
                const color = group?.color ?? '#999';
                return (
                  <div
                    key={r.sampleName}
                    onClick={() => selectPoint({
                      sampleName: r.sampleName,
                      groupName: r.groupName,
                      pc1: r.pc1,
                      pc2: r.pc2,
                      color,
                      shape: group?.shape ?? 1,
                    })}
                    style={{
                      padding: '3px 6px', cursor: 'pointer', fontSize: 12,
                      borderBottom: '1px solid #f5f5f5',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{
                      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: color, flexShrink: 0,
                    }} />
                    <strong>{r.sampleName}</strong>
                    <span style={{ color: '#888', fontSize: 11 }}>{r.groupName}</span>
                  </div>
                );
              })}
              {searchResults.length === 50 && (
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', padding: 4 }}>
                  仅显示前 50 条结果
                </div>
              )}
            </div>
          )}
          {searchQuery.trim() && searchResults.length === 0 && (
            <p style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>未找到匹配的样本</p>
          )}
        </div>
      )}

      {/* 离群检测警告 */}
      {hasOutliers && (
        <div className="sidebar-section" style={{
          border: '1px solid #ff9800',
          borderRadius: 4,
          padding: 8,
          background: '#fff8e1',
          marginBottom: 12,
        }}>
          <h4 style={{ color: '#e65100', marginTop: 0 }}>⚠ 离群提示</h4>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>
            检测到 {outlierResult.summary.totalOutliers} 个点可能混入相邻分组的置信椭圆内。
          </p>
          <button
            onClick={() => setOutlierDetailsExpanded(!outlierDetailsExpanded)}
            style={{
              border: 'none', background: 'transparent',
              color: '#1976d2', cursor: 'pointer', fontSize: 12,
              padding: 0,
            }}
          >
            {outlierDetailsExpanded ? '收起详情 ▲' : '展开详情 ▼'}
          </button>
          {outlierDetailsExpanded && (
            <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
              {/* 源组统计 */}
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                流出: {Object.entries(outlierResult.summary.bySourceGroup).map(([g, n]) => (
                  <span key={g} style={{ marginRight: 6 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: groups.find(gr => gr.name === g)?.color ?? '#999', marginRight: 2 }} />
                    {g}: {n}
                  </span>
                ))}
              </div>
              {/* 候选列表前20 */}
              {outlierResult.candidates.slice(0, 20).map((c, i) => (
                <div key={`${c.sampleName}_${c.targetGroup}_${i}`} style={{
                  fontSize: 11, padding: '3px 0', borderBottom: '1px solid #f0f0f0',
                }}>
                  <strong>{c.sampleName}</strong>
                  <span style={{ color: '#888' }}>
                    {' '}{c.sourceGroup} → {c.targetGroup}
                  </span>
                  <span style={{ color: '#aaa', fontSize: 10 }}>
                    {' '}({(c.normalizedDistSq * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
              {outlierResult.candidates.length > 20 && (
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  ...及其他 {outlierResult.candidates.length - 20} 个候选
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 选中点信息 */}
      {selectedPoints.length > 0 ? (
        <div className="sidebar-section">
          <h4>
            选中点 ({selectedPoints.length})
            <button
              onClick={clearSelection}
              style={{
                float: 'right', border: 'none', background: 'transparent',
                color: '#1976d2', cursor: 'pointer', fontSize: 12,
              }}
            >
              清除
            </button>
          </h4>
          {selectedPoints.map((p, i) => (
            <div key={`${p.sampleName}_${i}`} style={{
              border: '1px solid #eee', borderRadius: 4, padding: 6, marginBottom: 4, fontSize: 12,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.sampleName}</div>
              <div style={{ color: '#666' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: p.color, marginRight: 4, verticalAlign: 'middle' }} />
                {p.groupName}
              </div>
              <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 11 }}>
                PC1: {p.pc1.toFixed(4)} | PC2: {p.pc2.toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data-hint">
          {hasOutliers ? null : (
            <>
              点击图表中的数据点查看详细信息<br/>
              <small style={{ color: '#bbb' }}>按住 Ctrl 点击可多选</small>
            </>
          )}
        </div>
      )}
    </div>
  );
}
