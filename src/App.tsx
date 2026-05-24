import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DataRangeFilter,
  AddRecipientModal,
  TeamSearchModal,
} from './components';
import { Award, Recipient } from './components/types';
import awardsData from './mock/data/awards.json';

const steps = [
  { num: 1, label: '选择展播数据' },
  { num: 2, label: '制作展播' },
  { num: 3, label: '生成展播' },
];

// 所有可用的奖项数据
const ALL_AWARDS: Award[] = awardsData as Award[];

function App() {
  const [currentStep, setCurrentStep] = useState(0);

  const [awards, setAwards] = useState<Award[]>([]);

  // 当前选中的奖项ID
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');

  // 搜索关键词
  const [awardSearchKeyword, setAwardSearchKeyword] = useState('');
  const [recipientSearchKeyword, setRecipientSearchKeyword] = useState('');

  // 搜索到的奖项结果（未添加的）
  const [searchResults, setSearchResults] = useState<Award[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // 选中的获奖人/团队ID集合
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());

  const [addRecipientModalVisible, setAddRecipientModalVisible] = useState(false);
  const [teamSearchModalVisible, setTeamSearchModalVisible] = useState(false);
  const [teamSearchViewOnly] = useState(false);
  const [currentAwardId] = useState<string>('');
  const [currentAllRecipients] = useState<Recipient[]>([]);
  const [currentSelectedRecipients] = useState<Recipient[]>([]);

  // 删除确认对话框状态
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [awardToDelete, setAwardToDelete] = useState<Award | null>(null);

  const searchInputRef = useRef<HTMLDivElement>(null);

  const currentUserDepartment = 'IT平台服务部';

  const accessibleDepartments = [
    '全部部门',
    'IT平台服务部',
    '质量与流程IT部',
    '智能汽车解决方案部',
    '云与计算业务部',
    '华为公司',
  ];

  const [selectedDepartment, setSelectedDepartment] = useState<string>(currentUserDepartment);

  const YEAR_OPTIONS = [
    { value: '2025', label: '2025年' },
    { value: '2024', label: '2024年' },
    { value: '2023', label: '2023年' },
  ];

  const [selectedYear, setSelectedYear] = useState<string>('2025');

  // 当前选中的奖项
  const selectedAward = useMemo(() => {
    return awards.find(a => a.id === selectedAwardId);
  }, [awards, selectedAwardId]);

  // 筛选后的奖项列表
  const filteredAwards = useMemo(() => {
    let result = awards;
    if (selectedDepartment !== '全部部门') {
      result = result.filter(award => {
        if (award.awardType === 'individual') {
          return award.recipients.some(r => {
            const dept = r.department.split('/')[0];
            return dept === selectedDepartment;
          });
        } else {
          return award.teams?.some(t =>
            t.members?.some(m => {
              const dept = m.department.split('/')[0];
              return dept === selectedDepartment;
            })
          ) ?? false;
        }
      });
    }
    return result;
  }, [awards, selectedDepartment]);

  // 实时搜索奖项
  useEffect(() => {
    if (!awardSearchKeyword.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const keyword = awardSearchKeyword.toLowerCase().trim();
    const results = ALL_AWARDS.filter(award => {
      // 关键词模糊搜索 - 支持标题、颁发部门、类型等
      const searchText = [
        award.title,
        award.issuingDepartment,
        award.awardType === 'individual' ? '个人奖' : '团队奖',
        award.issueDate || '',
      ].join(' ').toLowerCase();

      return searchText.includes(keyword);
    });

    setSearchResults(results);
    setShowSearchDropdown(results.length > 0);
  }, [awardSearchKeyword, awards]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果删除确认对话框显示中，不关闭搜索下拉框
      if (deleteConfirmVisible) return;
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [deleteConfirmVisible]);

  // 添加奖项到列表
  const handleAddAwardToList = (award: Award) => {
    setAwards(prev => [...prev, award]);
    setShowSearchDropdown(false);
    setAwardSearchKeyword('');
    // 如果这是第一个添加的奖项，自动选中它
    if (awards.length === 0) {
      setSelectedAwardId(award.id);
    }
  };

  // 第二列显示的数据：获奖人或团队
  const secondColumnData = useMemo(() => {
    if (!selectedAward) return { type: null, data: [] };

    if (selectedAward.awardType === 'individual') {
      let recipients = selectedAward.recipients || [];
      if (recipientSearchKeyword) {
        recipients = recipients.filter(r =>
          r.name.toLowerCase().includes(recipientSearchKeyword.toLowerCase()) ||
          r.employeeId.includes(recipientSearchKeyword)
        );
      }
      return { type: 'individual', data: recipients };
    } else {
      let teams = selectedAward.teams || [];
      if (recipientSearchKeyword) {
        teams = teams.filter(t =>
          t.name.toLowerCase().includes(recipientSearchKeyword.toLowerCase())
        );
      }
      return { type: 'team', data: teams };
    }
  }, [selectedAward, recipientSearchKeyword]);

  // 第三列显示的数据：已选人员或团队
  const thirdColumnData = useMemo(() => {
    if (!selectedAward) return { type: null, data: [] };

    if (selectedAward.awardType === 'individual') {
      const selectedRecipients = selectedAward.recipients?.filter(r =>
        selectedRecipientIds.has(r.employeeId)
      ) || [];
      return { type: 'individual', data: selectedRecipients };
    } else {
      const selectedTeams = selectedAward.teams?.filter(t =>
        selectedTeamIds.has(t.id)
      ) || [];
      return { type: 'team', data: selectedTeams };
    }
  }, [selectedAward, selectedRecipientIds, selectedTeamIds]);

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
  };

  const handleSelectAward = (awardId: string) => {
    setSelectedAwardId(awardId);
    setSelectedRecipientIds(new Set());
    setSelectedTeamIds(new Set());
    setRecipientSearchKeyword('');
  };

  const handleToggleRecipient = (recipientId: string) => {
    setSelectedRecipientIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipientId)) {
        newSet.delete(recipientId);
      } else {
        newSet.add(recipientId);
      }
      return newSet;
    });
  };

  const handleToggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    if (selectedAward?.awardType === 'individual') {
      setSelectedRecipientIds(new Set());
    } else {
      setSelectedTeamIds(new Set());
    }
  };

  const handleRemoveAward = (awardId: string) => {
    setAwards(prev => prev.filter(a => a.id !== awardId));
    if (selectedAwardId === awardId) {
      setSelectedAwardId('');
      setSelectedRecipientIds(new Set());
      setSelectedTeamIds(new Set());
    }
  };

  // 显示删除确认对话框
  const handleShowDeleteConfirm = (award: Award) => {
    setAwardToDelete(award);
    setDeleteConfirmVisible(true);
  };

  // 确认删除奖项
  const handleConfirmDelete = () => {
    if (awardToDelete) {
      handleRemoveAward(awardToDelete.id);
      setDeleteConfirmVisible(false);
      setAwardToDelete(null);
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false);
    setAwardToDelete(null);
  };

  // 获取第二列标题
  const getSecondColumnTitle = () => {
    if (!selectedAward) return '选择获奖人/团队';
    return selectedAward.awardType === 'individual' ? '选择获奖人' : '选择团队';
  };

  // 获取第三列标题
  const getThirdColumnTitle = () => {
    if (!selectedAward) return '已选';
    return selectedAward.awardType === 'individual' ? '已选获奖人' : '已选团队';
  };

  return (
    <div
      className="app"
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <header
        style={{
          backgroundColor: '#1a1a2e',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
          获奖海报生成系统
        </h1>
        <div style={{ fontSize: '14px', color: '#a0aec0' }}>
          当前用户: 李水花 (IT平台服务部)
        </div>
      </header>

      <div
        style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {steps.map((step, index) => (
            <React.Fragment key={step.num}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: index <= currentStep ? '#1890ff' : '#f1f5f9',
                    color: index <= currentStep ? '#fff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {step.num}
                </div>
                <span
                  style={{
                    fontSize: '14px',
                    color: index <= currentStep ? '#1890ff' : '#94a3b8',
                    fontWeight: index === currentStep ? 500 : 400,
                  }}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  style={{
                    width: '120px',
                    height: '2px',
                    backgroundColor: index < currentStep ? '#1890ff' : '#f1f5f9',
                    margin: '0 16px',
                    marginBottom: '24px',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <main style={{ padding: '24px 24px 120px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        {currentStep === 0 && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#333', whiteSpace: 'nowrap' }}>年份:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '90px',
                  }}
                >
                  {YEAR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <DataRangeFilter
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                accessibleDepartments={accessibleDepartments}
                currentUserDepartment={currentUserDepartment}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                height: 'calc(100vh - 280px)',
                minHeight: '400px',
                overflow: 'hidden',
              }}
            >
              {/* 第一列：选择奖项 */}
              <div
                style={{
                  borderRight: '1px solid #e8e8e8',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #e8e8e8',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#333',
                  }}
                >
                  选择奖项
                </div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8' }}>
                  <div
                    ref={searchInputRef}
                    style={{
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      <input
                        type="text"
                        placeholder="搜索并添加奖项"
                        value={awardSearchKeyword}
                        onChange={(e) => setAwardSearchKeyword(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                        style={{
                          flex: 1,
                          border: 'none',
                          background: 'transparent',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                      {awardSearchKeyword && (
                        <button
                          onClick={() => {
                            setAwardSearchKeyword('');
                            setShowSearchDropdown(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#999">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    {/* 搜索下拉结果 */}
                    {showSearchDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: '#fff',
                          border: '1px solid #e8e8e8',
                          borderRadius: '4px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          zIndex: 100,
                          maxHeight: '416px',
                          overflow: 'auto',
                        }}
                      >
                        {searchResults.length === 0 ? (
                          <div style={{ padding: '12px 16px', color: '#999', fontSize: '14px' }}>
                            未找到匹配的奖项
                          </div>
                        ) : (
                          <>
                            <div
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#fafafa',
                                fontSize: '12px',
                                color: '#999',
                                borderBottom: '1px solid #f0f0f0',
                              }}
                            >
                              找到 {searchResults.length} 个奖项
                            </div>
                            {searchResults.map((award) => {
                              const isAlreadyAdded = awards.some(a => a.id === award.id);
                              return (
                                <div
                                  key={award.id}
                                  onClick={() => isAlreadyAdded ? handleShowDeleteConfirm(award) : handleAddAwardToList(award)}
                                  style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f0f0f0',
                                    transition: 'background-color 0.2s',
                                    backgroundColor: isAlreadyAdded ? '#fff2f0' : '#fff',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isAlreadyAdded) {
                                      e.currentTarget.style.backgroundColor = '#e6f7ff';
                                    } else {
                                      e.currentTarget.style.backgroundColor = '#ffe6e6';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = isAlreadyAdded ? '#fff2f0' : '#fff';
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span
                                      style={{
                                        padding: '2px 8px',
                                        backgroundColor: award.awardType === 'individual' ? '#e6f7ff' : '#f6ffed',
                                        color: award.awardType === 'individual' ? '#1890ff' : '#52c41a',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '28px',
                                      }}
                                    >
                                      {award.awardType === 'individual' ? '个人' : '团队'}
                                    </span>
                                    <span style={{ fontSize: '14px', color: isAlreadyAdded ? '#999' : '#333', flex: 1 }}>
                                      {award.title}
                                    </span>
                                    {isAlreadyAdded ? (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4d4f">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
                                      </svg>
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#1890ff">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
                  {awards.length === 0 ? (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#999' }}>
                      <div style={{ marginBottom: '8px' }}>暂无奖项</div>
                      <div style={{ fontSize: '12px' }}>搜索奖项新增奖项目</div>
                    </div>
                  ) : (
                    filteredAwards.map((award) => (
                      <div
                        key={award.id}
                        onClick={() => handleSelectAward(award.id)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          backgroundColor: selectedAwardId === award.id ? '#e6f7ff' : 'transparent',
                          borderLeft: selectedAwardId === award.id ? '3px solid #1890ff' : '3px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          const btn = e.currentTarget.querySelector('.delete-award-btn') as HTMLElement;
                          if (btn) btn.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          const btn = e.currentTarget.querySelector('.delete-award-btn') as HTMLElement;
                          if (btn) btn.style.opacity = '0';
                        }}
                      >
                        {/* 奖项类型图标 */}
                        {award.awardType === 'individual' ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1890ff">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#52c41a">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                          </svg>
                        )}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span 
                            style={{ 
                              fontSize: '14px', 
                              color: '#333',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={award.title}
                          >
                            {award.title}
                          </span>
                        </div>
                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAward(award.id);
                          }}
                          className="delete-award-btn"
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: '#ff4d4f',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            flexShrink: 0,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            zIndex: 10,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 第二列：选择获奖人/团队 */}
              <div
                style={{
                  borderRight: '1px solid #e8e8e8',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #e8e8e8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
                    {getSecondColumnTitle()}
                    {selectedAward && (
                      <span style={{ fontSize: '14px', color: '#999', fontWeight: 400, marginLeft: '8px' }}>
                        共{secondColumnData.data.length}{selectedAward.awardType === 'individual' ? '人' : '个'}
                      </span>
                    )}
                  </span>
                  {selectedAward && secondColumnData.data.length > 0 && (
                    <button
                      onClick={() => {
                        const allIds = secondColumnData.data.map((item: any) =>
                          selectedAward.awardType === 'individual' ? item.employeeId : item.id
                        );
                        const allSelected = allIds.every((id: string) =>
                          selectedAward.awardType === 'individual'
                            ? selectedRecipientIds.has(id)
                            : selectedTeamIds.has(id)
                        );
                        if (allSelected) {
                          // 取消全选
                          if (selectedAward.awardType === 'individual') {
                            setSelectedRecipientIds(prev => {
                              const newSet = new Set(prev);
                              allIds.forEach((id: string) => newSet.delete(id));
                              return newSet;
                            });
                          } else {
                            setSelectedTeamIds(prev => {
                              const newSet = new Set(prev);
                              allIds.forEach((id: string) => newSet.delete(id));
                              return newSet;
                            });
                          }
                        } else {
                          // 全选
                          if (selectedAward.awardType === 'individual') {
                            setSelectedRecipientIds(prev => {
                              const newSet = new Set(prev);
                              allIds.forEach((id: string) => newSet.add(id));
                              return newSet;
                            });
                          } else {
                            setSelectedTeamIds(prev => {
                              const newSet = new Set(prev);
                              allIds.forEach((id: string) => newSet.add(id));
                              return newSet;
                            });
                          }
                        }
                      }}
                      style={{
                        fontSize: '14px',
                        color: '#1890ff',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {secondColumnData.data.every((item: any) =>
                        selectedAward.awardType === 'individual'
                          ? selectedRecipientIds.has(item.employeeId)
                          : selectedTeamIds.has(item.id)
                      ) ? '取消全选' : '全选'}
                    </button>
                  )}
                </div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      placeholder={!selectedAward ? (awards.length === 0 ? '请搜索' : '请先选择奖项') : (selectedAward.awardType === 'individual' ? '搜索获奖人' : '搜索团队')}
                      value={recipientSearchKeyword}
                      onChange={(e) => setRecipientSearchKeyword(e.target.value)}
                      disabled={!selectedAward}
                      style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
                  {!selectedAward ? (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#999' }}>
                      <div style={{ fontSize: '12px' }}>选择奖项后查看获奖人/团队</div>
                    </div>
                  ) : secondColumnData.data.length === 0 ? (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#999' }}>
                      <div style={{ marginBottom: '8px' }}>该奖项暂无获奖人/团队数据</div>
                      <div style={{ fontSize: '12px' }}>请尝试选择其他奖项</div>
                    </div>
                  ) : (
                    secondColumnData.data.map((item: any) => {
                      const isIndividual = selectedAward.awardType === 'individual';
                      const itemId = isIndividual ? item.employeeId : item.id;
                      const isSelected = isIndividual
                        ? selectedRecipientIds.has(itemId)
                        : selectedTeamIds.has(itemId);

                      return (
                        <div
                          key={itemId}
                          onClick={() => isIndividual ? handleToggleRecipient(itemId) : handleToggleTeam(itemId)}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              border: `2px solid ${isSelected ? '#1890ff' : '#d9d9d9'}`,
                              borderRadius: '2px',
                              backgroundColor: isSelected ? '#1890ff' : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span 
                              style={{ 
                                fontSize: '14px', 
                                color: '#333',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={isIndividual ? item.name : item.name}
                            >
                              {isIndividual ? item.name : item.name}
                            </span>
                            {isIndividual && (
                              <span 
                                style={{ 
                                  fontSize: '12px', 
                                  color: '#999',
                                  flexShrink: 0,
                                }}
                              >
                                {item.department}
                              </span>
                            )}

                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 第三列：已选 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #e8e8e8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
                    {getThirdColumnTitle()}({thirdColumnData.data.length})
                  </span>
                  {thirdColumnData.data.length > 0 && (
                    <button
                      onClick={handleClearSelection}
                      style={{
                        fontSize: '14px',
                        color: '#1890ff',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      清空
                    </button>
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
                  {!selectedAward ? (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#999' }}>
                      <div style={{ fontSize: '12px' }}>选择奖项后查看已选内容</div>
                    </div>
                  ) : thirdColumnData.data.length === 0 ? (
                    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#999' }}>
                      <div style={{ fontSize: '12px' }}>
                        {selectedAward.awardType === 'individual' ? '请在左侧选择获奖人' : '请在左侧选择获奖团队'}
                      </div>
                    </div>
                  ) : (
                    thirdColumnData.data.map((item: any) => {
                      const isIndividual = selectedAward.awardType === 'individual';
                      const itemId = isIndividual ? item.employeeId : item.id;

                      return (
                        <div
                          key={itemId}
                          style={{
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            position: 'relative',
                          }}
                          onMouseEnter={(e) => {
                            const btn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                            if (btn) btn.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            const btn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                            if (btn) btn.style.opacity = '0';
                          }}
                        >
                          {/* 根据类型显示不同图标 */}
                          {isIndividual ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1890ff">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#52c41a">
                              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                            </svg>
                          )}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span 
                              style={{ 
                                fontSize: '14px', 
                                color: '#333',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={isIndividual ? item.name : item.name}
                            >
                              {isIndividual ? item.name : item.name}
                            </span>
                            {isIndividual && (
                              <span style={{ fontSize: '12px', color: '#999', flexShrink: 0 }}>
                                {item.department}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => isIndividual ? handleToggleRecipient(itemId) : handleToggleTeam(itemId)}
                            className="delete-btn"
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: 'none',
                              backgroundColor: '#ff4d4f',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              flexShrink: 0,
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1a1a2e' }}>制作展播</h2>
            <p>请先在第一步选择展播数据</p>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1a1a2e' }}>生成展播</h2>
            <p>请先在第二步制作展播</p>
          </div>
        )}
      </main>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTop: '1px solid #e2e8f0',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {currentStep === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              padding: '12px 20px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid #f0f0f0',
            }}
          >
            <span style={{ fontSize: '14px', color: '#666' }}>
              已选 <strong style={{ color: '#1890ff', fontSize: '16px', fontWeight: 600 }}>{awards.length}</strong> 个奖项
            </span>
          </div>
        )}

        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            style={{
              padding: '8px 24px',
              backgroundColor: '#fff',
              color: '#1a1a2e',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            上一步
          </button>
        )}
        {currentStep < steps.length - 1 && (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={currentStep === 0 ? selectedRecipientIds.size === 0 && selectedTeamIds.size === 0 : false}
            style={{
              padding: '8px 24px',
              backgroundColor: currentStep === 0 && selectedRecipientIds.size === 0 && selectedTeamIds.size === 0 ? '#e2e8f0' : '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: currentStep === 0 && selectedRecipientIds.size === 0 && selectedTeamIds.size === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              zIndex: 1000,
            }}
          >
            下一步
          </button>
        )}
        {currentStep === steps.length - 1 && (
          <button
            style={{
              padding: '8px 24px',
              backgroundColor: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            生成展播
          </button>
        )}
      </div>

      <AddRecipientModal
        visible={addRecipientModalVisible}
        currentDepartment={selectedDepartment === '全部部门' ? '' : selectedDepartment}
        currentAward={awards.find(a => a.id === currentAwardId)}
        allRecipients={currentAllRecipients}
        selectedRecipients={currentSelectedRecipients}
        onCancel={() => setAddRecipientModalVisible(false)}
        onConfirm={() => setAddRecipientModalVisible(false)}
      />

      <TeamSearchModal
        visible={teamSearchModalVisible}
        awardTitle={awards.find(a => a.id === currentAwardId)?.title || ''}
        existingTeams={(() => {
          const award = awards.find(a => a.id === currentAwardId);
          return teamSearchViewOnly
            ? (award?.teams || [])
            : (award?.allTeams || award?.teams || []);
        })()}
        onCancel={() => setTeamSearchModalVisible(false)}
        onConfirm={() => setTeamSearchModalVisible(false)}
        currentDepartment={selectedDepartment === '全部部门' ? '' : selectedDepartment}
        viewOnly={teamSearchViewOnly}
        onTeamUpdate={() => {}}
      />

      {/* 删除确认对话框 */}
      {deleteConfirmVisible && (
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
            zIndex: 2000,
          }}
          onClick={handleCancelDelete}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              width: '400px',
              padding: '24px',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff4d4f">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
                确认删除
              </span>
            </div>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
              确定要从奖项列表中删除「{awardToDelete?.title}」吗？
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#fff',
                  color: '#595959',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#40a9ff';
                  e.currentTarget.style.color = '#1890ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = '#595959';
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#ff4d4f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff7875';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff4d4f';
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
