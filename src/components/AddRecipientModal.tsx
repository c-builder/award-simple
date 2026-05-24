import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Recipient, Award } from './types';
import { DeptCascader } from './DeptCascader';
import { Pagination, MODAL_TABLE_MIN_HEIGHT } from './Pagination';

export interface AddRecipientModalProps {
  visible: boolean;
  currentDepartment?: string;
  currentAward?: Award;
  allRecipients?: Recipient[];
  selectedRecipients?: Recipient[];
  onCancel: () => void;
  onConfirm: (selectedRecipients: Recipient[]) => void;
  readonly?: boolean; // 只读模式（查看全部时使用）
}

const DEFAULT_PAGE_SIZE = 10;

export const AddRecipientModal: React.FC<AddRecipientModalProps> = ({
  visible,
  currentAward,
  allRecipients = [],
  onCancel,
  onConfirm,
  readonly = false,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedDeptPath, setSelectedDeptPath] = useState<string[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hoveredRecipientId, setHoveredRecipientId] = useState<string | null>(null);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      setSearchText('');
      setSelectedDeptPath([]);
      // 初始化时，根据 allRecipients 中的 isSelected 状态设置选中
      const initiallySelected = allRecipients.filter(r => r.isSelected).map(r => ({ ...r }));
      setSelectedRecipients(initiallySelected);
      setCurrentPage(1);
      setPageSize(DEFAULT_PAGE_SIZE);
    }
  }, [visible, allRecipients]);

  const employeePool = useMemo(() => {
    return allRecipients.map(r => ({
      name: r.name,
      employeeId: r.employeeId,
      department: r.department,
      isSelected: r.isSelected,
    }));
  }, [allRecipients]);

  const isSelected = (employeeId: string) => {
    return selectedRecipients.some(r => r.employeeId === employeeId);
  };

  const filteredEmployees = useMemo(() => {
    return employeePool.filter(emp => {
      const matchSearch = !searchText || 
        emp.name.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.employeeId.includes(searchText);
      
      let matchDept = true;
      if (selectedDeptPath.length > 0) {
        const deptParts = emp.department.split('/');
        matchDept = selectedDeptPath.every((dept, index) => deptParts[index] === dept);
      }
      
      return matchSearch && matchDept;
    });
  }, [employeePool, searchText, selectedDeptPath]);

  // 所有员工都可以选择
  const selectableEmployees = useMemo(() => {
    return filteredEmployees;
  }, [filteredEmployees]);

  const selectedCount = useMemo(() => {
    return selectableEmployees.filter(e => isSelected(e.employeeId)).length;
  }, [selectableEmployees, selectedRecipients]);

  const isAllSelected = selectableEmployees.length > 0 && selectedCount === selectableEmployees.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < selectableEmployees.length;
  const isHeaderDisabled = selectableEmployees.length === 0;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const toggleSelection = (recipient: Recipient) => {
    const selected = isSelected(recipient.employeeId);

    if (selected) {
      // 取消勾选
      setSelectedRecipients(prev => prev.filter(r => r.employeeId !== recipient.employeeId));
    } else {
      // 勾选
      setSelectedRecipients(prev => [...prev, { ...recipient }]);
    }
  };

  // 从已选列表中移除
  const removeFromSelected = (employeeId: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.employeeId !== employeeId));
  };

  const handleConfirm = () => {
    // 保存时只返回当前选中的获奖人
    onConfirm(selectedRecipients);
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedDeptPath([]);
    setCurrentPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflow: 'hidden',
        overscrollBehavior: 'contain',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          width: '1100px',
          minHeight: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#333' }}>
            {readonly ? '获奖人列表' : '编辑获奖人'}{currentAward ? ` - ${currentAward.title}` : ''}
          </h3>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: '#999',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#333';
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#999';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* 主内容区域 - 左右布局 */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', overscrollBehavior: 'contain' }}>
          {/* 左侧 - 已选获奖人 */}
          {!readonly && (
            <div
              style={{
                width: '280px',
                borderRight: '1px solid #f0f0f0',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fafafa',
              }}
            >
              {/* 左侧标题 */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: '#f5f5f5',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  已选获奖人
                </span>
                <span
                  style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    backgroundColor: '#1890ff',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                >
                  {selectedRecipients.length}人
                </span>
              </div>

              {/* 已选列表 */}
              <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                {selectedRecipients.length === 0 ? (
                  <div
                    style={{
                      padding: '40px 16px',
                      textAlign: 'center',
                      color: '#999',
                      fontSize: '14px',
                    }}
                  >
                    暂无已选获奖人
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedRecipients.map((recipient) => (
                      <div
                        key={recipient.employeeId}
                        style={{
                          padding: '12px',
                          backgroundColor: '#fff',
                          borderRadius: '6px',
                          border: '1px solid #e8e8e8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'default',
                          transition: 'all 0.2s',
                          boxShadow: hoveredRecipientId === recipient.employeeId
                            ? '0 2px 8px rgba(0,0,0,0.1)'
                            : 'none',
                        }}
                        onMouseEnter={() => setHoveredRecipientId(recipient.employeeId)}
                        onMouseLeave={() => setHoveredRecipientId(null)}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* 第一行：姓名 + 工号 + 删除按钮 */}
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#333',
                              marginBottom: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {recipient.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: '#666',
                                  fontFamily: 'monospace',
                                  fontWeight: 400,
                                  flexShrink: 0,
                                }}
                              >
                                {recipient.employeeId}
                              </span>
                            </div>
                            <button
                              onClick={() => removeFromSelected(recipient.employeeId)}
                              style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: hoveredRecipientId === recipient.employeeId ? '#ff4d4f' : 'transparent',
                                color: hoveredRecipientId === recipient.employeeId ? '#fff' : '#999',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: hoveredRecipientId === recipient.employeeId ? 'pointer' : 'default',
                                flexShrink: 0,
                                opacity: hoveredRecipientId === recipient.employeeId ? 1 : 0.6,
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                              }}
                              title="删除"
                            >
                              ×
                            </button>
                          </div>
                          {/* 第二行：部门 */}
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#999',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {recipient.department}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 右侧 - 搜索和表格 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 搜索栏 */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <input
                type="text"
                placeholder="请输入姓名/工号"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '180px',
                  outline: 'none',
                }}
              />
              <span style={{ color: '#666', fontSize: '14px' }}>部门:</span>
              <DeptCascader
                value={selectedDeptPath}
                onChange={(value) => { setSelectedDeptPath(value); setCurrentPage(1); }}
                placeholder="全部部门"
              />
              <button
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                查询
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#fff',
                  color: '#666',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                重置
              </button>
            </div>

            {/* 表格区域 */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* 表格 */}
              <div style={{ flex: 1, overflow: 'auto', padding: '16px 0', minHeight: MODAL_TABLE_MIN_HEIGHT }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fafafa' }}>
                      {!readonly && (
                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#333', borderBottom: '2px solid #e8e8e8', fontSize: '13px', width: '60px' }}>
                          <div
                            onClick={() => {
                              if (isHeaderDisabled) return;
                              if (isAllSelected) {
                                setSelectedRecipients(prev => prev.filter(r => !selectableEmployees.some(e => e.employeeId === r.employeeId)));
                              } else {
                                setSelectedRecipients(prev => {
                                  const existingIds = new Set(prev.map(r => r.employeeId));
                                  const toAdd = selectableEmployees.filter(e => !existingIds.has(e.employeeId)).map(e => ({ ...e, isSelected: true }));
                                  return [...prev, ...toAdd];
                                });
                              }
                            }}
                            style={{
                              width: '18px',
                              height: '18px',
                              border: `2px solid ${isHeaderDisabled ? '#d9d9d9' : isAllSelected || isIndeterminate ? '#1890ff' : '#d9d9d9'}`,
                              borderRadius: '3px',
                              backgroundColor: isAllSelected || isIndeterminate ? '#1890ff' : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              cursor: isHeaderDisabled ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                              opacity: isHeaderDisabled ? 0.5 : 1,
                            }}
                          >
                            {isAllSelected ? (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#fff"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : isIndeterminate ? (
                              <div
                                style={{
                                  width: '10px',
                                  height: '2px',
                                  backgroundColor: '#fff',
                                  borderRadius: '1px',
                                }}
                              />
                            ) : null}
                          </div>
                        </th>
                      )}
                      <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#333', borderBottom: '2px solid #e8e8e8', fontSize: '13px', width: '80px' }}>序号</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#333', borderBottom: '2px solid #e8e8e8', fontSize: '13px' }}>姓名</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#333', borderBottom: '2px solid #e8e8e8', fontSize: '13px' }}>工号</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#333', borderBottom: '2px solid #e8e8e8', fontSize: '13px' }}>部门</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployees.map((emp, index) => {
                      const selected = isSelected(emp.employeeId);
                      const seq = (currentPage - 1) * pageSize + index + 1;
                      return (
                        <tr
                          key={emp.employeeId}
                          style={{
                            backgroundColor: 'transparent',
                            cursor: readonly ? 'default' : 'pointer',
                          }}
                          onClick={() => !readonly && toggleSelection(emp)}
                        >
                          {!readonly && (
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  border: `2px solid ${selected ? '#1890ff' : '#d9d9d9'}`,
                                  borderRadius: '3px',
                                  backgroundColor: selected ? '#1890ff' : '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  margin: '0 auto',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {selected && (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#fff"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                            </td>
                          )}
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center', color: '#666' }}>
                            {seq}
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', color: '#333' }}>
                            {emp.name}
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', color: '#666', fontFamily: 'monospace' }}>{emp.employeeId}</td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', color: '#666' }}>{emp.department}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 分页器 */}
              {filteredEmployees.length > 0 && (
                <div style={{
                  padding: '0 24px',
                  borderTop: '1px solid #f0f0f0',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  {!readonly ? (
                    <div style={{ fontSize: '14px', color: '#595959' }}>
                      已选 <span style={{ color: '#1890ff', fontWeight: 500 }}>{selectedRecipients.length}</span> 人
                    </div>
                  ) : (
                    <div />
                  )}
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredEmployees.length}
                    onChange={handlePageChange}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                    showTotal
                    showPageSize
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          {readonly ? (
            <button
              onClick={onCancel}
              style={{
                padding: '8px 24px',
                backgroundColor: '#1890ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              关闭
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#fff',
                  color: '#666',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                保存
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddRecipientModal;
