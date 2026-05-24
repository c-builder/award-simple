import React, { useState, useEffect, useMemo } from 'react';
import { Pagination, MODAL_TABLE_MIN_HEIGHT } from './Pagination';
import { AwardDetailDrawer } from './AwardDetailDrawer';
import { DeptCascader } from './DeptCascader';
import type { Team } from './types';

export interface TeamSearchModalProps {
  visible: boolean;
  awardTitle?: string;
  existingTeams?: Team[];
  onCancel: () => void;
  onConfirm: (selectedTeams: Team[]) => void;
  viewOnly?: boolean;
  currentDepartment?: string;
  onTeamUpdate?: (team: Team) => void;
}

export const TeamSearchModal: React.FC<TeamSearchModalProps> = ({
  visible,
  awardTitle = '',
  existingTeams: propExistingTeams = [],
  onCancel,
  onConfirm,
  viewOnly = false,
  currentDepartment: _currentDepartment = '',
  onTeamUpdate,
}) => {
  // 使用本地状态管理 teams，以便支持实时更新
  const [existingTeams, setExistingTeams] = useState<Team[]>(propExistingTeams);

  // 当 prop 变化时同步更新本地状态
  useEffect(() => {
    setExistingTeams(propExistingTeams);
  }, [propExistingTeams]);

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedDeptPath, setSelectedDeptPath] = useState<string[]>([]);
  const [teamNameSearch, setTeamNameSearch] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const [searchBtnHovered, setSearchBtnHovered] = useState(false);
  const [resetBtnHovered, setResetBtnHovered] = useState(false);
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false);
  const [confirmBtnHovered, setConfirmBtnHovered] = useState(false);
  const [employeeInputFocused, setEmployeeInputFocused] = useState(false);
  const [teamNameInputFocused, setTeamNameInputFocused] = useState(false);
  const [selectedTeamForDetail, setSelectedTeamForDetail] = useState<Team | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerReadOnly, setDrawerReadOnly] = useState(false);

  // 当弹框打开或 existingTeams 变化时，同步选中状态
  useEffect(() => {
    if (visible) {
      // 从 existingTeams 中获取 isSelected 为 true 的团队ID
      const selectedFromState = existingTeams.filter(t => t.isSelected).map(t => t.id);
      
      // 如果没有团队被选中（isSelected: true），则默认选中所有团队
      // 这与 AwardCard 中的逻辑保持一致
      if (selectedFromState.length === 0 && existingTeams.length > 0) {
        const allTeamIds = existingTeams.map(t => t.id);
        setSelectedTeams(new Set(allTeamIds));
      } else {
        setSelectedTeams(new Set(selectedFromState));
      }
      
      setEmployeeSearch('');
      setSelectedDeptPath([]);
      setTeamNameSearch('');
      setCurrentPage(1);
    }
  }, [visible, existingTeams]);

  const filteredTeams = useMemo(() => {
    return existingTeams.filter(team => {
      // 工号/姓名搜索
      if (employeeSearch.trim()) {
        const query = employeeSearch.trim().toLowerCase();
        const matchEmployee = team.members?.some(member =>
          member.employeeId.toLowerCase().includes(query) ||
          member.name.toLowerCase().includes(query)
        );
        if (!matchEmployee) return false;
      }

      // 部门搜索 - 使用 DeptCascader 的值
      if (selectedDeptPath.length > 0) {
        const selectedDept = selectedDeptPath[0];
        const matchDepartment = team.members?.some(member =>
          member.department.split('/')[0] === selectedDept
        );
        if (!matchDepartment) return false;
      }

      // 团队名搜索
      if (teamNameSearch.trim()) {
        const query = teamNameSearch.trim().toLowerCase();
        const matchTeamName = team.name.toLowerCase().includes(query);
        if (!matchTeamName) return false;
      }

      return true;
    });
  }, [existingTeams, employeeSearch, selectedDeptPath, teamNameSearch]);

  const paginatedTeams = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTeams.slice(startIndex, startIndex + pageSize);
  }, [filteredTeams, currentPage, pageSize]);

  // 获取已选团队列表
  const selectedTeamsList = useMemo(() => {
    return existingTeams.filter(team => selectedTeams.has(team.id));
  }, [existingTeams, selectedTeams]);

  const handleReset = () => {
    setEmployeeSearch('');
    setSelectedDeptPath([]);
    setTeamNameSearch('');
    setCurrentPage(1);
  };

  const toggleTeamSelection = (teamId: string) => {
    if (viewOnly) return;
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeams(newSelected);
  };

  // 从已选列表中移除
  const removeFromSelected = (teamId: string) => {
    if (viewOnly) return;
    const newSelected = new Set(selectedTeams);
    newSelected.delete(teamId);
    setSelectedTeams(newSelected);
  };

  const handleConfirm = () => {
    const updatedTeams = existingTeams.map(team => ({
      ...team,
      isSelected: selectedTeams.has(team.id),
    }));
    onConfirm(updatedTeams);
  };

  const isAllSelected = filteredTeams.length > 0 &&
    filteredTeams.every(team => selectedTeams.has(team.id));
  const isIndeterminate = filteredTeams.some(team => selectedTeams.has(team.id)) &&
    !filteredTeams.every(team => selectedTeams.has(team.id));

  const toggleAll = () => {
    if (viewOnly) return;
    if (isAllSelected) {
      const newSelected = new Set(selectedTeams);
      filteredTeams.forEach(team => newSelected.delete(team.id));
      setSelectedTeams(newSelected);
    } else {
      const newSelected = new Set(selectedTeams);
      filteredTeams.forEach(team => newSelected.add(team.id));
      setSelectedTeams(newSelected);
    }
  };

  if (!visible) return null;

  const thStyle: React.CSSProperties = {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#333',
    borderBottom: '2px solid #e8e8e8',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  };

  const tdStyle = (isLast: boolean): React.CSSProperties => ({
    padding: '13px 16px',
    borderBottom: isLast ? 'none' : '1px solid #f0f0f0',
    fontSize: '14px',
  });

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
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12), 0 3px 6px -4px rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
            编辑获奖团队{awardTitle ? ` - ${awardTitle}` : ''}
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
          {/* 左侧 - 已选获奖团队 */}
          {!viewOnly && (
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
                  已选获奖团队
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
                  {selectedTeams.size}个
                </span>
              </div>

              {/* 已选列表 */}
              <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                {selectedTeams.size === 0 ? (
                  <div
                    style={{
                      padding: '40px 16px',
                      textAlign: 'center',
                      color: '#999',
                      fontSize: '14px',
                    }}
                  >
                    暂无已选团队
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTeamsList.map((team) => (
                      <div
                        key={team.id}
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
                          boxShadow: hoveredTeamId === team.id
                            ? '0 2px 8px rgba(0,0,0,0.1)'
                            : 'none',
                        }}
                        onMouseEnter={() => setHoveredTeamId(team.id)}
                        onMouseLeave={() => setHoveredTeamId(null)}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
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
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {team.name}
                            </span>
                            <button
                              onClick={() => removeFromSelected(team.id)}
                              style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: hoveredTeamId === team.id ? '#ff4d4f' : 'transparent',
                                color: hoveredTeamId === team.id ? '#fff' : '#999',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: hoveredTeamId === team.id ? 'pointer' : 'default',
                                flexShrink: 0,
                                opacity: hoveredTeamId === team.id ? 1 : 0.6,
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
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#666',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            <span>{team.members?.filter(m => m.isSelected !== false).length || 0}人</span>
                            <button
                              onClick={() => {
                                setSelectedTeamForDetail(team);
                                setDrawerReadOnly(false);
                                setDrawerVisible(true);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#1890ff',
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              <span>编辑成员</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
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
                padding: '12px 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#fafafa',
              }}
            >
              <input
                type="text"
                placeholder="请输入姓名/工号"
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setCurrentPage(1);
                }}
                onFocus={() => setEmployeeInputFocused(true)}
                onBlur={() => setEmployeeInputFocused(false)}
                style={{
                  padding: '6px 12px',
                  border: `1px solid ${employeeInputFocused ? '#1890ff' : '#d9d9d9'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  flex: 1,
                  minWidth: '120px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: employeeInputFocused ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
                }}
              />
              <DeptCascader
                value={selectedDeptPath}
                onChange={(value) => {
                  setSelectedDeptPath(value);
                  setCurrentPage(1);
                }}
                placeholder="全部部门"
              />
              <input
                type="text"
                placeholder="请输入团队名"
                value={teamNameSearch}
                onChange={(e) => {
                  setTeamNameSearch(e.target.value);
                  setCurrentPage(1);
                }}
                onFocus={() => setTeamNameInputFocused(true)}
                onBlur={() => setTeamNameInputFocused(false)}
                style={{
                  padding: '6px 12px',
                  border: `1px solid ${teamNameInputFocused ? '#1890ff' : '#d9d9d9'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  flex: 1,
                  minWidth: '120px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: teamNameInputFocused ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
                }}
              />
              <button
                onClick={() => setCurrentPage(1)}
                disabled={!employeeSearch.trim() && selectedDeptPath.length === 0 && !teamNameSearch.trim()}
                onMouseEnter={() => setSearchBtnHovered(true)}
                onMouseLeave={() => setSearchBtnHovered(false)}
                style={{
                  padding: '6px 20px',
                  backgroundColor: (!employeeSearch.trim() && selectedDeptPath.length === 0 && !teamNameSearch.trim()) ? '#d9d9d9' : (searchBtnHovered ? '#40a9ff' : '#1890ff'),
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: (!employeeSearch.trim() && selectedDeptPath.length === 0 && !teamNameSearch.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                查询
              </button>
              <button
                onClick={handleReset}
                onMouseEnter={() => setResetBtnHovered(true)}
                onMouseLeave={() => setResetBtnHovered(false)}
                style={{
                  padding: '6px 20px',
                  backgroundColor: '#fff',
                  color: '#595959',
                  border: `1px solid ${resetBtnHovered ? '#40a9ff' : '#d9d9d9'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                重置
              </button>
            </div>

            {/* 表格区域 */}
            <div style={{ flex: 1, overflow: 'auto', overscrollBehavior: 'contain', minHeight: MODAL_TABLE_MIN_HEIGHT }}>
              {filteredTeams.length === 0 ? (
                <div style={{
                  padding: '48px 0',
                  textAlign: 'center',
                  color: '#bfbfbf',
                  fontSize: '14px',
                }}>
                  暂无团队数据
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fafafa' }}>
                      {!viewOnly && (
                        <th style={{ ...thStyle, textAlign: 'center', width: '50px' }}>
                          <div
                            onClick={toggleAll}
                            style={{
                              width: '18px',
                              height: '18px',
                              border: `2px solid ${isAllSelected || isIndeterminate ? '#1890ff' : '#d9d9d9'}`,
                              borderRadius: '3px',
                              backgroundColor: isAllSelected || isIndeterminate ? '#1890ff' : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {isAllSelected ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : isIndeterminate ? (
                              <div style={{ width: '10px', height: '2px', backgroundColor: '#fff', borderRadius: '1px' }} />
                            ) : null}
                          </div>
                        </th>
                      )}
                      <th style={{ ...thStyle, textAlign: 'center', width: '60px' }}>序号</th>
                      <th style={{ ...thStyle }}>奖项名称</th>
                      <th style={{ ...thStyle, width: '80px' }}>奖项类别</th>
                      <th style={{ ...thStyle, width: '90px' }}>获奖人数</th>
                      <th style={{ ...thStyle, width: '200px' }}>颁发/设立部门</th>
                      <th style={{ ...thStyle, textAlign: 'center', width: '100px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTeams.map((team, index) => {
                      const isSelected = selectedTeams.has(team.id);
                      const seq = (currentPage - 1) * pageSize + index + 1;

                      return (
                        <tr
                          key={team.id}
                          style={{
                            backgroundColor: hoveredRowId === team.id ? '#fafafa' : 'transparent',
                            cursor: viewOnly ? 'default' : 'pointer',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={() => setHoveredRowId(team.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                        >
                          {!viewOnly && (
                            <td style={{ ...tdStyle(false), textAlign: 'center' }}>
                              <div
                                onClick={() => toggleTeamSelection(team.id)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  border: `2px solid ${isSelected ? '#1890ff' : '#d9d9d9'}`,
                                  borderRadius: '3px',
                                  backgroundColor: isSelected ? '#1890ff' : '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  margin: '0 auto',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {isSelected && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                            </td>
                          )}
                          <td style={{ ...tdStyle(false), textAlign: 'center', color: '#8c8c8c' }}>
                            {seq}
                          </td>
                          <td style={{ ...tdStyle(false), color: '#262626', fontWeight: 500 }}>
                            {team.name}
                          </td>
                          <td style={{ ...tdStyle(false), color: '#595959' }}>
                            团队奖
                          </td>
                          <td style={{ ...tdStyle(false), color: '#595959' }}>
                            {team.memberCount}
                          </td>
                          <td style={{ ...tdStyle(false), color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {awardTitle ? awardTitle.split('2025年')[1]?.split('奖')[0] + '奖' : 'IT平台服务部/平台开发部'}
                          </td>
                          <td style={{ ...tdStyle(false), textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setSelectedTeamForDetail(team);
                                setDrawerReadOnly(true);
                                setDrawerVisible(true);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#1890ff',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                margin: '0 auto',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e6f7ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <span>查看详情</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* 分页器 */}
            <div style={{
              padding: '0 24px',
              borderTop: '1px solid #f0f0f0',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              {!viewOnly ? (
                <div style={{ fontSize: '14px', color: '#595959' }}>
                  已选 <span style={{ color: '#1890ff', fontWeight: 500 }}>{selectedTeams.size}</span> 个团队
                </div>
              ) : (
                <div />
              )}
              {filteredTeams.length > 0 && (
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredTeams.length}
                  onChange={setCurrentPage}
                  onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                  showTotal
                  showPageSize
                />
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onCancel}
            onMouseEnter={() => setCancelBtnHovered(true)}
            onMouseLeave={() => setCancelBtnHovered(false)}
            style={{
              padding: '8px 24px',
              backgroundColor: '#fff',
              color: '#595959',
              border: `1px solid ${cancelBtnHovered ? '#40a9ff' : '#d9d9d9'}`,
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            onMouseEnter={() => setConfirmBtnHovered(true)}
            onMouseLeave={() => setConfirmBtnHovered(false)}
            style={{
              padding: '8px 24px',
              backgroundColor: confirmBtnHovered ? '#40a9ff' : '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            保存
          </button>
        </div>
      </div>

      {/* 团队详情 Drawer - 与首页共用 */}
      <AwardDetailDrawer
        visible={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedTeamForDetail(null);
        }}
        mode="team"
        team={selectedTeamForDetail || undefined}
        awardTitle={awardTitle}
        showSearch
        showPagination
        readOnly={drawerReadOnly}
        onSelectionChange={(selectedMemberIds) => {
          if (selectedTeamForDetail) {
            // 更新团队成员的选中状态
            const updatedMembers = selectedTeamForDetail.members?.map(member => ({
              ...member,
              isSelected: selectedMemberIds.includes(member.employeeId),
            })) || [];

            const updatedTeam: Team = {
              ...selectedTeamForDetail,
              members: updatedMembers,
              memberCount: updatedMembers.filter(m => m.isSelected !== false).length,
            };

            // 更新抽屉中的团队数据
            setSelectedTeamForDetail(updatedTeam);

            // 更新 existingTeams 中对应的团队数据
            setExistingTeams(prev => prev.map(t =>
              t.id === updatedTeam.id ? updatedTeam : t
            ));

            // 实时通知父组件更新首页卡片
            if (onTeamUpdate) {
              onTeamUpdate(updatedTeam);
            }
          }
        }}
      />
    </div>
  );
};

export default TeamSearchModal;
