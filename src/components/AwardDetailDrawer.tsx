import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Pagination } from './Pagination';
import { DeptCascader } from './DeptCascader';
import type { Team, Recipient } from './types';

export interface AwardDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  mode: 'award' | 'team';
  awardTitle?: string;
  teams?: Team[];
  team?: Team;
  showSearch?: boolean;
  showPagination?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  /** 是否只读模式（不显示多选列和已选统计） */
  readOnly?: boolean;
}

export const AwardDetailDrawer: React.FC<AwardDetailDrawerProps> = ({
  visible,
  onClose,
  mode,
  awardTitle,
  teams = [],
  team,
  showSearch = false,
  showPagination = false,
  onSelectionChange,
  readOnly = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptPath, setSelectedDeptPath] = useState<string[]>([]);
  const [expandedTeamIds, setExpandedTeamIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // 多选状态：存储选中的团队ID或成员ID
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 使用 ref 存储上一次的 visible 值，只在 visible 从 false 变为 true 时重置状态
  const prevVisibleRef = useRef(visible);

  useEffect(() => {
    // 只在 Drawer 打开时（visible 从 false 变为 true）重置状态
    if (visible && !prevVisibleRef.current) {
      setSearchQuery('');
      setSelectedDeptPath([]);
      setCurrentPage(1);
      
      // 根据传入数据的 isSelected 状态初始化选中状态
      if (isAwardMode) {
        const selectedTeamIds = teams.filter(t => t.isSelected !== false).map(t => t.id);
        setSelectedIds(new Set(selectedTeamIds));
        if (onSelectionChange) {
          onSelectionChange(selectedTeamIds);
        }
      } else if (team) {
        const selectedMemberIds = team.members?.filter(m => m.isSelected !== false).map(m => m.employeeId) || [];
        setSelectedIds(new Set(selectedMemberIds));
        if (onSelectionChange) {
          onSelectionChange(selectedMemberIds);
        }
      }
      
      if (teams.length === 1) {
        setExpandedTeamIds(new Set([teams[0].id]));
      } else if (team) {
        setExpandedTeamIds(new Set([team.id]));
      } else {
        setExpandedTeamIds(new Set());
      }
    }
    prevVisibleRef.current = visible;
  }, [visible, teams, team]);

  // 禁止底层页面滚动
  useEffect(() => {
    if (visible) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [visible]);

  const isAwardMode = mode === 'award';

  const filteredTeams = useMemo(() => {
    if (isAwardMode) {
      return teams.filter(t => {
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          if (!t.name.toLowerCase().includes(query)) return false;
        }
        if (selectedDeptPath.length > 0) {
          const selectedDept = selectedDeptPath[0];
          const hasMemberInDept = t.members?.some(m =>
            m.department.split('/')[0] === selectedDept
          );
          if (!hasMemberInDept) return false;
        }
        return true;
      });
    } else {
      if (!team) return [];
      const filteredMembers = team.members?.filter(m => {
        if (m.isSelected === false) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          if (!m.name.toLowerCase().includes(query) && !m.employeeId.toLowerCase().includes(query)) return false;
        }
        if (selectedDeptPath.length > 0) {
          const selectedDept = selectedDeptPath[0];
          if (m.department.split('/')[0] !== selectedDept) return false;
        }
        return true;
      }) || [];
      return [{
        ...team,
        members: filteredMembers,
        memberCount: filteredMembers.length,
      }];
    }
  }, [teams, team, searchQuery, selectedDeptPath, isAwardMode]);

  const paginatedTeams = useMemo(() => {
    if (!showPagination) return filteredTeams;
    const start = (currentPage - 1) * pageSize;
    return filteredTeams.slice(start, start + pageSize);
  }, [filteredTeams, currentPage, pageSize, showPagination]);

  // 成员模式分页
  const filteredMembers = useMemo(() => {
    if (isAwardMode || !team) return [];
    return team.members?.filter(m => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        return m.name.toLowerCase().includes(query) || m.employeeId.toLowerCase().includes(query);
      }
      return true;
    }) || [];
  }, [team, searchQuery, isAwardMode]);

  const paginatedMembers = useMemo(() => {
    if (!showPagination) return filteredMembers;
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize, showPagination]);

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeamIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  // 处理多选
  const handleSelectAll = (checked: boolean) => {
    if (isAwardMode) {
      const newSelectedIds = checked ? new Set(filteredTeams.map(t => t.id)) : new Set<string>();
      setSelectedIds(newSelectedIds);
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelectedIds));
      }
    } else if (team) {
      const newSelectedIds = checked ? new Set(team.members?.map(m => m.employeeId) || []) : new Set<string>();
      setSelectedIds(newSelectedIds);
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelectedIds));
      }
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
    if (onSelectionChange) {
      onSelectionChange(Array.from(newSelectedIds));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  const displayTeams = isAwardMode ? paginatedTeams : filteredTeams;
  // 总人数显示所有成员（不根据选中状态过滤）
  const totalMemberCount = isAwardMode
    ? filteredTeams.reduce((sum, t) => sum + (t.members?.length || 0), 0)
    : (team?.members?.length || 0);

  const searchPlaceholder = isAwardMode ? '搜索团队名称…' : '搜索姓名/工号…';
  
  // 判断是否全选
  const isAllSelected = isAwardMode 
    ? filteredTeams.length > 0 && filteredTeams.every(t => selectedIds.has(t.id))
    : (team?.members?.length || 0) > 0 && (team?.members?.every(m => selectedIds.has(m.employeeId)) || false);
  
  // 判断是否半选（部分选中）
  const isIndeterminate = isAwardMode
    ? filteredTeams.length > 0 && filteredTeams.some(t => selectedIds.has(t.id)) && !filteredTeams.every(t => selectedIds.has(t.id))
    : (team?.members?.length || 0) > 0 && (team?.members?.some(m => selectedIds.has(m.employeeId)) && !team?.members?.every(m => selectedIds.has(m.employeeId)) || false);

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          zIndex: 1050,
          animation: 'fadeIn 0.3s ease',
        }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '700px',
          maxWidth: '100%',
          backgroundColor: '#fff',
          zIndex: 1051,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.15)',
          animation: 'slideIn 0.3s ease',
          overscrollBehavior: 'contain',
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            @keyframes fadeIn, @keyframes slideIn {
              from, to { animation: none; }
            }
          }
        `}</style>

        {/* 标题区 */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              id="drawer-title"
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: '#1a1a2e',
              }}
            >
              {isAwardMode ? awardTitle : `${awardTitle} - ${team?.name}`}
            </h3>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              {readOnly
                ? (isAwardMode ? `共 ${filteredTeams.length} 个团队` : `共 ${totalMemberCount} 人`)
                : (isAwardMode
                  ? `共 ${filteredTeams.length} 个团队，已选 ${selectedIds.size} 个`
                  : `共 ${totalMemberCount} 人，已选 ${selectedIds.size} 人`
                )
              }
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭详情"
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 搜索区 */}
        {showSearch && (
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: '#fafafa',
              display: 'flex',
              gap: '12px',
            }}
          >
            <input
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: `1px solid ${searchFocused ? '#1890ff' : '#d9d9d9'}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: searchFocused ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
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
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDeptPath([]);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#fff',
                color: '#595959',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#40a9ff';
                e.currentTarget.style.color = '#40a9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = '#595959';
              }}
            >
              重置
            </button>
          </div>
        )}

        {/* 表格区 */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '0',
          }}
        >
          {displayTeams.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 0',
                color: '#999',
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d9d9d9"
                strokeWidth="1.5"
                style={{ marginBottom: '16px' }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="11" y2="17" />
              </svg>
              <div>{searchQuery || selectedDeptPath.length > 0 ? '未找到匹配结果' : '暂无数据'}</div>
            </div>
          ) : (
            <div>
              {/* 表格头部 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 24px',
                  backgroundColor: '#fafafa',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#333',
                }}
              >
                {!readOnly && (
                  <div style={{ width: '50px', display: 'flex', justifyContent: 'center' }}>
                    <div
                      onClick={() => handleSelectAll(!isAllSelected)}
                      style={{
                        width: '18px',
                        height: '18px',
                        border: `2px solid ${isAllSelected || isIndeterminate ? '#1890ff' : '#d9d9d9'}`,
                        borderRadius: '3px',
                        backgroundColor: isAllSelected || isIndeterminate ? '#1890ff' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                  </div>
                )}
                <div style={{ flex: 1 }}>{isAwardMode ? '团队名称' : '姓名'}</div>
                <div style={{ width: '120px' }}>{isAwardMode ? '成员数' : '工号'}</div>
                <div style={{ width: '200px' }}>部门</div>
                {isAwardMode && <div style={{ width: '60px' }}>操作</div>}
              </div>

              {/* 表格内容 */}
              {isAwardMode ? (
                // 团队模式：表格行 + 可展开成员列表
                displayTeams.map((t) => (
                  <TeamTableRow
                    key={t.id}
                    team={t}
                    isSelected={selectedIds.has(t.id)}
                    isExpanded={expandedTeamIds.has(t.id)}
                    onSelect={(checked) => handleSelectItem(t.id, checked)}
                    onToggle={() => toggleTeamExpand(t.id)}
                    readOnly={readOnly}
                  />
                ))
              ) : (
                // 成员模式：简单表格行（支持分页）
                paginatedMembers.map((member, index) => (
                  <MemberTableRow
                    key={member.employeeId}
                    member={member}
                    index={(currentPage - 1) * pageSize + index + 1}
                    isSelected={selectedIds.has(member.employeeId)}
                    onSelect={(checked) => handleSelectItem(member.employeeId, checked)}
                    readOnly={readOnly}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* 分页 */}
        {showPagination && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={isAwardMode ? filteredTeams.length : filteredMembers.length}
              onChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              showTotal
              showPageSize
            />
          </div>
        )}
      </div>
    </>
  );
};

// 团队表格行组件
interface TeamTableRowProps {
  team: Team;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (checked: boolean) => void;
  onToggle: () => void;
  readOnly?: boolean;
}

const TeamTableRow: React.FC<TeamTableRowProps> = ({
  team,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  readOnly = false,
}) => {
  const selectedMembers = team.members?.filter(m => m.isSelected !== false) || [];

  return (
    <>
      {/* 团队行 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fafafa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#fff';
        }}
      >
        {!readOnly && (
          <div style={{ width: '50px', display: 'flex', justifyContent: 'center' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect(!isSelected);
              }}
              style={{
                width: '18px',
                height: '18px',
                border: `2px solid ${isSelected ? '#1890ff' : '#d9d9d9'}`,
                borderRadius: '3px',
                backgroundColor: isSelected ? '#1890ff' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
          </div>
        )}
        <div style={{ flex: 1, fontSize: '14px', color: '#333' }}>{team.name}</div>
        <div style={{ width: '120px', fontSize: '14px', color: '#666' }}>{selectedMembers.length}人</div>
        <div style={{ width: '200px', fontSize: '14px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {team.members?.[0]?.department || '-'}
        </div>
        <div style={{ width: '60px' }}>
          <button
            onClick={onToggle}
            style={{
              background: 'none',
              border: 'none',
              color: '#1890ff',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{isExpanded ? '收起' : '展开'}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* 展开的成员列表 */}
      {isExpanded && (
        <div
          style={{
            backgroundColor: '#fafafa',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {selectedMembers.length === 0 ? (
            <div style={{ padding: '16px 24px 16px 64px', fontSize: '13px', color: '#999' }}>
              暂无成员
            </div>
          ) : (
            <div style={{ padding: '8px 24px 8px 64px' }}>
              {selectedMembers.map((member, index) => (
                <div
                  key={member.employeeId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < selectedMembers.length - 1 ? '1px dashed #e8e8e8' : 'none',
                  }}
                >
                  <span style={{ width: '24px', fontSize: '12px', color: '#999' }}>{index + 1}</span>
                  <span style={{ width: '80px', fontSize: '14px', color: '#333' }}>{member.name}</span>
                  <span style={{ width: '100px', fontSize: '13px', color: '#666' }}>{member.employeeId}</span>
                  <span style={{ flex: 1, fontSize: '13px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.department}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

// 成员表格行组件
interface MemberTableRowProps {
  member: Recipient;
  index: number;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  readOnly?: boolean;
}

const MemberTableRow: React.FC<MemberTableRowProps> = ({
  member,
  isSelected,
  onSelect,
  readOnly = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fff',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#fafafa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#fff';
      }}
    >
      {!readOnly && (
        <div style={{ width: '50px', display: 'flex', justifyContent: 'center' }}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(!isSelected);
            }}
            style={{
              width: '18px',
              height: '18px',
              border: `2px solid ${isSelected ? '#1890ff' : '#d9d9d9'}`,
              borderRadius: '3px',
              backgroundColor: isSelected ? '#1890ff' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px', color: '#333' }}>{member.name}</span>
      </div>
      <div style={{ width: '120px', fontSize: '14px', color: '#666' }}>{member.employeeId}</div>
      <div style={{ width: '200px', fontSize: '14px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {member.department}
      </div>
    </div>
  );
};

export default AwardDetailDrawer;
