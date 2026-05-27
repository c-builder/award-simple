import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DataRangeFilter,
  AddRecipientModal,
  TeamSearchModal,
  Pagination,
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

const DEFAULT_YEAR = '2025';
const DEFAULT_DEPARTMENT = '全部部门';

function filterAwardsByCriteria(params: {
  year: string;
  department: string;
  awardTypeFilter: 'all' | 'individual' | 'team';
  recipientSearchInput: string;
  awardNameKeyword?: string;
}): Award[] {
  let results = [...ALL_AWARDS];

  results = results.filter(award => {
    if (!award.issueDate) return false;
    return award.issueDate.startsWith(params.year);
  });

  if (params.department !== DEFAULT_DEPARTMENT) {
    results = results.filter(award => {
      if (award.awardType === 'individual') {
        return award.recipients?.some(r => {
          const dept = r.department.split('/')[0];
          return dept === params.department;
        });
      }
      return award.teams?.some(t =>
        t.members?.some(m => {
          const dept = m.department.split('/')[0];
          return dept === params.department;
        })
      );
    });
  }

  if (params.awardTypeFilter !== 'all') {
    results = results.filter(award => award.awardType === params.awardTypeFilter);
  }

  if (params.recipientSearchInput.trim()) {
    const keyword = params.recipientSearchInput.toLowerCase().trim();
    results = results.filter(award => {
      if (award.awardType === 'individual') {
        return award.recipients?.some(r =>
          r.name.toLowerCase().includes(keyword) ||
          r.employeeId.includes(keyword)
        );
      }
      return award.teams?.some(t =>
        t.members?.some(m =>
          m.name.toLowerCase().includes(keyword) ||
          m.employeeId.includes(keyword)
        )
      );
    });
  }

  if (params.awardNameKeyword?.trim()) {
    const keyword = params.awardNameKeyword.toLowerCase().trim();
    results = results.filter(award => award.title.toLowerCase().includes(keyword));
  }

  return results;
}

const PANEL_HEADER_STYLE: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#fafbfc',
  borderBottom: '1px solid #eef0f3',
  display: 'flex',
  alignItems: 'center',
  minHeight: '40px',
  boxSizing: 'border-box',
};

const PANEL_HEADER_LEFT_STYLE: React.CSSProperties = {
  ...PANEL_HEADER_STYLE,
  borderRight: '1px solid #e5e7eb',
};

function FlowGuideBar() {
  const items = [
    '上方筛选栏设条件，点「查询」',
    '查询结果中点 + 加入已选奖项',
    '「已选奖项」中选中一项，右侧勾选人员',
  ];
  return (
    <div style={{ ...PANEL_HEADER_LEFT_STYLE, overflowX: 'auto', overflowY: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
      >
        {items.map((text, index) => (
          <React.Fragment key={text}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
              <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                {text}
              </span>
            </div>
            {index < items.length - 1 && (
              <span style={{ color: '#c4c9d4', fontSize: '13px', flexShrink: 0, userSelect: 'none', padding: '0 2px' }}>›</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ColumnEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        textAlign: 'center',
      }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h6" />
      </svg>
      <div style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>{title}</div>
      {description && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '12px',
            color: '#9ca3af',
            lineHeight: 1.6,
            maxWidth: '480px',
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}

function App() {
  const [currentStep, setCurrentStep] = useState(0);

  const [awards, setAwards] = useState<Award[]>([]);

  // 当前选中的奖项ID
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');

  // 搜索关键词
  const [awardSearchKeyword, setAwardSearchKeyword] = useState('');
  const [recipientSearchKeyword, setRecipientSearchKeyword] = useState('');

  // 左侧奖项区 Tab：查询结果 / 已选奖项
  const [awardPanelTab, setAwardPanelTab] = useState<'search' | 'selected'>('search');

  // 查询奖项结果
  const [searchResults, setSearchResults] = useState<Award[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // 查询结果分页
  const [searchPage, setSearchPage] = useState(1);
  const searchPageSize = 8;

  // 奖项分类筛选（个人/团队）
  const [awardTypeFilter, setAwardTypeFilter] = useState<'all' | 'individual' | 'team'>('all');

  // 获奖人搜索关键词
  const [recipientSearchInput, setRecipientSearchInput] = useState('');

  // 按奖项ID保存选中的获奖人/团队ID集合
  const [awardSelections, setAwardSelections] = useState<{
    [awardId: string]: {
      recipientIds: Set<string>;
      teamIds: Set<string>;
    }
  }>({});

  const [addRecipientModalVisible, setAddRecipientModalVisible] = useState(false);
  const [teamSearchModalVisible, setTeamSearchModalVisible] = useState(false);
  const [teamSearchViewOnly] = useState(false);
  const [currentAwardId] = useState<string>('');
  const [currentAllRecipients] = useState<Recipient[]>([]);
  const [currentSelectedRecipients] = useState<Recipient[]>([]);

  const currentUserDepartment = '数字金融服务部';

  const accessibleDepartments = [
    '全部部门',
    '数字金融服务部',
    '智能制造研究院',
    '新能源技术中心',
    '医疗健康事业部',
    '国际化业务部',
    '创新孵化中心',
  ];

  const [selectedDepartment, setSelectedDepartment] = useState<string>('全部部门');

  const YEAR_OPTIONS = [
    { value: '2025', label: '2025年' },
    { value: '2024', label: '2024年' },
    { value: '2023', label: '2023年' },
  ];

  const [selectedYear, setSelectedYear] = useState<string>(DEFAULT_YEAR);

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

  const handleSearchAwards = () => {
    const results = filterAwardsByCriteria({
      year: selectedYear,
      department: selectedDepartment,
      awardTypeFilter,
      recipientSearchInput,
      awardNameKeyword: awardSearchKeyword,
    });
    setSearchResults(results);
    setHasSearched(true);
    setSearchPage(1);
  };

  const handleResetFilters = () => {
    setSelectedYear(DEFAULT_YEAR);
    setSelectedDepartment(DEFAULT_DEPARTMENT);
    setAwardTypeFilter('all');
    setRecipientSearchInput('');
    setAwardSearchKeyword('');
    setSearchResults([]);
    setHasSearched(false);
    setSearchPage(1);
  };

  // 年份、部门、奖项分类由用户变更时自动查询（首次加载不查询）
  const prevFilterCriteria = useRef<{
    year: string;
    department: string;
    awardTypeFilter: 'all' | 'individual' | 'team';
  } | null>(null);
  useEffect(() => {
    const prev = prevFilterCriteria.current;
    if (prev === null) {
      prevFilterCriteria.current = {
        year: selectedYear,
        department: selectedDepartment,
        awardTypeFilter,
      };
      return;
    }
    if (
      prev.year === selectedYear &&
      prev.department === selectedDepartment &&
      prev.awardTypeFilter === awardTypeFilter
    ) {
      return;
    }
    prevFilterCriteria.current = {
      year: selectedYear,
      department: selectedDepartment,
      awardTypeFilter,
    };
    const results = filterAwardsByCriteria({
      year: selectedYear,
      department: selectedDepartment,
      awardTypeFilter,
      recipientSearchInput,
      awardNameKeyword: awardSearchKeyword,
    });
    setSearchResults(results);
    setHasSearched(true);
    setSearchPage(1);
  }, [selectedYear, selectedDepartment, awardTypeFilter]);

  // 查询结果分页
  const paginatedSearchResults = useMemo(() => {
    const startIndex = (searchPage - 1) * searchPageSize;
    return searchResults.slice(startIndex, startIndex + searchPageSize);
  }, [searchResults, searchPage]);

  // 结果变少导致当前页超出范围时，回退到最后一页
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(searchResults.length / searchPageSize));
    setSearchPage((page) => (page > totalPages ? totalPages : page));
  }, [searchResults.length, searchPageSize]);

  // 添加奖项到列表
  const handleAddAwardToList = (award: Award) => {
    setAwards(prev => {
      if (prev.some(a => a.id === award.id)) return prev;
      return [...prev, award];
    });
  };

  const canConfigureRecipients = awards.length > 0 && !!selectedAward;

  // 从列表中移除奖项
  const handleRemoveAwardFromList = (awardId: string) => {
    setAwards(prev => prev.filter(a => a.id !== awardId));
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

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
  };

  const handleSelectAward = (awardId: string) => {
    setSelectedAwardId(awardId);
    setRecipientSearchKeyword('');
    setAwardPanelTab('selected');
  };

  const handleToggleRecipient = (awardId: string, recipientId: string) => {
    setAwardSelections(prev => {
      const currentSelection = prev[awardId] || { recipientIds: new Set(), teamIds: new Set() };
      const newRecipientIds = new Set(currentSelection.recipientIds);
      if (newRecipientIds.has(recipientId)) {
        newRecipientIds.delete(recipientId);
      } else {
        newRecipientIds.add(recipientId);
      }
      return {
        ...prev,
        [awardId]: {
          ...currentSelection,
          recipientIds: newRecipientIds,
        },
      };
    });
  };

  const handleToggleTeam = (awardId: string, teamId: string) => {
    setAwardSelections(prev => {
      const currentSelection = prev[awardId] || { recipientIds: new Set(), teamIds: new Set() };
      const newTeamIds = new Set(currentSelection.teamIds);
      if (newTeamIds.has(teamId)) {
        newTeamIds.delete(teamId);
      } else {
        newTeamIds.add(teamId);
      }
      return {
        ...prev,
        [awardId]: {
          ...currentSelection,
          teamIds: newTeamIds,
        },
      };
    });
  };

  const handleRemoveAward = (awardId: string) => {
    setAwards(prev => prev.filter(a => a.id !== awardId));
    if (selectedAwardId === awardId) {
      setSelectedAwardId('');
    }
    // 清除该奖项的选中记录
    setAwardSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[awardId];
      return newSelections;
    });
  };

  const handleClearAllAwards = () => {
    setAwards([]);
    setSelectedAwardId('');
    setAwardSelections({});
    setRecipientSearchKeyword('');
  };

  // 第三列标题
  const getThirdColumnTitle = () => {
    if (!selectedAward) return '选择获奖人/团队';
    return selectedAward.awardType === 'individual' ? '选择获奖人' : '选择团队';
  };

  // 获取当前奖项的选中状态
  const getCurrentSelection = () => {
    if (!selectedAward) return { recipientIds: new Set<string>(), teamIds: new Set<string>() };
    return awardSelections[selectedAward.id] || { recipientIds: new Set<string>(), teamIds: new Set<string>() };
  };

  // 获取所有奖项的总选中数量
  const getTotalSelectedCount = () => {
    let total = 0;
    Object.values(awardSelections).forEach(selection => {
      total += selection.recipientIds.size + selection.teamIds.size;
    });
    return total;
  };

  return (
    <div
      className="app"
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <header
        style={{
          flexShrink: 0,
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
          flexShrink: 0,
          backgroundColor: '#fff',
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
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

      <main
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '24px',
          paddingBottom: '80px',
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {currentStep === 0 && (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '24px',
                flexWrap: 'wrap',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#374151', whiteSpace: 'nowrap', fontWeight: 500 }}>年份:</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#374151', whiteSpace: 'nowrap', fontWeight: 500 }}>部门:</span>
                <DataRangeFilter
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  accessibleDepartments={accessibleDepartments}
                  currentUserDepartment={currentUserDepartment}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#374151', whiteSpace: 'nowrap', fontWeight: 500 }}>奖项:</span>
                <input
                  type="text"
                  placeholder="奖项名称"
                  value={awardSearchKeyword}
                  onChange={(e) => setAwardSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchAwards();
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    outline: 'none',
                    minWidth: '180px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#374151', whiteSpace: 'nowrap', fontWeight: 500 }}>奖项分类:</span>
                <select
                  value={awardTypeFilter}
                  onChange={(e) => setAwardTypeFilter(e.target.value as 'all' | 'individual' | 'team')}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '100px',
                  }}
                >
                  <option value="all">全部</option>
                  <option value="individual">个人奖</option>
                  <option value="team">团队奖</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#374151', whiteSpace: 'nowrap', fontWeight: 500 }}>获奖人:</span>
                <input
                  type="text"
                  placeholder="获奖人姓名/工号"
                  value={recipientSearchInput}
                  onChange={(e) => setRecipientSearchInput(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    outline: 'none',
                    minWidth: '150px',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleSearchAwards}
                style={{
                  padding: '6px 20px',
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
                type="button"
                onClick={handleResetFilters}
                style={{
                  padding: '6px 20px',
                  backgroundColor: '#fff',
                  color: '#374151',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                重置
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                height: 'calc(100vh - 326px)',
                maxHeight: '100%',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
                  gridTemplateRows: 'auto auto 1fr',
                  gap: '0',
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                }}
              >
                <FlowGuideBar />

                {/* 右栏顶行：与左侧引导条等高 */}
                <div
                  style={{
                    ...PANEL_HEADER_STYLE,
                    padding: '8px 20px',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                    {getThirdColumnTitle()}
                  </span>
                </div>

                {/* 左栏 Tab 行 */}
                <div
                  style={{
                    ...PANEL_HEADER_LEFT_STYLE,
                    borderBottom: '1px solid #e5e7eb',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      padding: '2px',
                      backgroundColor: '#eef0f3',
                      borderRadius: '6px',
                      gap: '2px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setAwardPanelTab('search')}
                      style={{
                        padding: '4px 12px',
                        fontSize: '13px',
                        fontWeight: awardPanelTab === 'search' ? 600 : 400,
                        color: awardPanelTab === 'search' ? '#1890ff' : '#6b7280',
                        background: awardPanelTab === 'search' ? '#fff' : 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: awardPanelTab === 'search' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      查询结果
                      {hasSearched && (
                        <span
                          style={{
                            fontSize: '11px',
                            minWidth: '18px',
                            height: '18px',
                            padding: '0 5px',
                            borderRadius: '9px',
                            backgroundColor: awardPanelTab === 'search' ? '#e6f7ff' : '#e5e7eb',
                            color: awardPanelTab === 'search' ? '#1890ff' : '#6b7280',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {searchResults.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAwardPanelTab('selected')}
                      style={{
                        padding: '4px 12px',
                        fontSize: '13px',
                        fontWeight: awardPanelTab === 'selected' ? 600 : 400,
                        color: awardPanelTab === 'selected' ? '#1890ff' : '#6b7280',
                        background: awardPanelTab === 'selected' ? '#fff' : 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: awardPanelTab === 'selected' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      已选奖项
                      <span
                        style={{
                          fontSize: '11px',
                          minWidth: '18px',
                          height: '18px',
                          padding: '0 5px',
                          borderRadius: '9px',
                          backgroundColor:
                            awards.length > 0
                              ? awardPanelTab === 'selected'
                                ? '#e6f7ff'
                                : '#e5e7eb'
                              : '#e5e7eb',
                          color:
                            awards.length > 0
                              ? awardPanelTab === 'selected'
                                ? '#1890ff'
                                : '#6b7280'
                              : '#9ca3af',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {awards.length}
                      </span>
                    </button>
                  </div>
                  {awardPanelTab === 'selected' && awards.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllAwards}
                      style={{
                        fontSize: '13px',
                        color: '#1890ff',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e6f7ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      清空已选奖项
                    </button>
                  )}
                </div>

                {/* 右栏第二行：与 Tab 行对齐 */}
                <div
                  style={{
                    ...PANEL_HEADER_STYLE,
                    borderBottom: '1px solid #e5e7eb',
                    justifyContent: 'space-between',
                    padding: '8px 20px',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {selectedAward ? (
                      <span
                        style={{
                          display: 'inline-block',
                          maxWidth: '100%',
                          padding: '2px 8px',
                          backgroundColor: '#f0f7ff',
                          border: '1px solid #d6e8ff',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#0958d9',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={selectedAward.title}
                      >
                        {selectedAward.title}
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>请先选择奖项</span>
                    )}
                  </div>
                  {canConfigureRecipients && selectedAward && secondColumnData.data.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {(() => {
                        const currentSelection = getCurrentSelection();
                        const selectedCount = selectedAward.awardType === 'individual'
                          ? currentSelection.recipientIds.size
                          : currentSelection.teamIds.size;
                        const allIds = secondColumnData.data.map((item: { employeeId?: string; id?: string }) =>
                          selectedAward.awardType === 'individual' ? item.employeeId! : item.id!
                        );
                        const allSelected = allIds.every((id: string) =>
                          selectedAward.awardType === 'individual'
                            ? currentSelection.recipientIds.has(id)
                            : currentSelection.teamIds.has(id)
                        );
                        return (
                          <>
                            <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                              已选 <strong style={{ color: '#1890ff', fontWeight: 600 }}>{selectedCount}</strong>
                              {selectedAward.awardType === 'individual' ? '人' : '个'}
                              <span style={{ color: '#9ca3af', marginLeft: '4px' }}>
                                / 共{secondColumnData.data.length}{selectedAward.awardType === 'individual' ? '人' : '个'}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (allSelected) {
                                  setAwardSelections(prev => {
                                    const current = prev[selectedAward.id] || { recipientIds: new Set(), teamIds: new Set() };
                                    const newRecipientIds = new Set(current.recipientIds);
                                    const newTeamIds = new Set(current.teamIds);
                                    if (selectedAward.awardType === 'individual') {
                                      allIds.forEach((id: string) => newRecipientIds.delete(id));
                                    } else {
                                      allIds.forEach((id: string) => newTeamIds.delete(id));
                                    }
                                    return {
                                      ...prev,
                                      [selectedAward.id]: {
                                        recipientIds: newRecipientIds,
                                        teamIds: newTeamIds,
                                      },
                                    };
                                  });
                                } else {
                                  setAwardSelections(prev => {
                                    const current = prev[selectedAward.id] || { recipientIds: new Set(), teamIds: new Set() };
                                    const newRecipientIds = new Set(current.recipientIds);
                                    const newTeamIds = new Set(current.teamIds);
                                    if (selectedAward.awardType === 'individual') {
                                      allIds.forEach((id: string) => newRecipientIds.add(id));
                                    } else {
                                      allIds.forEach((id: string) => newTeamIds.add(id));
                                    }
                                    return {
                                      ...prev,
                                      [selectedAward.id]: {
                                        recipientIds: newRecipientIds,
                                        teamIds: newTeamIds,
                                      },
                                    };
                                  });
                                }
                              }}
                              style={{
                                fontSize: '13px',
                                color: '#1890ff',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {allSelected ? '取消全选' : '全选'}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* 左栏内容区 */}
                <div
                  style={{
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fafbfc',
                    borderRight: '1px solid #e5e7eb',
                  }}
                >
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                    margin: '6px 10px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  {awardPanelTab === 'search' ? (
                  !hasSearched ? (
                    <ColumnEmptyState
                      title="尚未查询"
                      description="在页面顶部筛选栏（年份、部门等）设置条件后，点击「查询」"
                    />
                  ) : searchResults.length === 0 ? (
                    <div
                      style={{
                        padding: '40px 24px',
                        textAlign: 'center',
                        color: '#9ca3af',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1,
                      }}
                    >
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d9d9d9" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                        <path d="M8 11h6" />
                      </svg>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>未找到匹配的奖项</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>可调整筛选条件后点击「查询」重试</div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          backgroundColor: '#fafafa',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6b7280',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ width: '40px', flexShrink: 0, textAlign: 'center' }}>序号</span>
                        <span style={{ width: '40px', flexShrink: 0, textAlign: 'center' }}>类型</span>
                        <span style={{ flex: 1 }}>奖项名称</span>
                                <span style={{ width: '40px', flexShrink: 0, textAlign: 'center' }} title="加入已选奖项">操作</span>
                      </div>
                      <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
                        {paginatedSearchResults.map((award, index) => {
                          const isAdded = awards.some(a => a.id === award.id);
                          const serialNo = (searchPage - 1) * searchPageSize + index + 1;
                          return (
                            <div
                              key={award.id}
                              onClick={() => {
                                if (isAdded) {
                                  handleRemoveAwardFromList(award.id);
                                } else {
                                  handleAddAwardToList(award);
                                }
                              }}
                              style={{
                                padding: '11px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                transition: 'background-color 0.15s',
                                backgroundColor: '#fff',
                                borderLeft: isAdded ? '3px solid #52c41a' : '3px solid transparent',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f5f9ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fff';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    width: '40px',
                                    flexShrink: 0,
                                    textAlign: 'center',
                                    fontSize: '13px',
                                    color: '#6b7280',
                                  }}
                                >
                                  {serialNo}
                                </span>
                                <span
                                  style={{
                                    width: '40px',
                                    flexShrink: 0,
                                    padding: '2px 0',
                                    backgroundColor: award.awardType === 'individual' ? '#e6f7ff' : '#fff7e6',
                                    color: award.awardType === 'individual' ? '#1890ff' : '#fa8c16',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {award.awardType === 'individual' ? '个人' : '团队'}
                                </span>
                                <span style={{ fontSize: '14px', color: '#1f2937', flex: 1 }}>
                                  {award.title}
                                </span>
                                <span
                                  style={{
                                    width: '40px',
                                    flexShrink: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title={isAdded ? '从已选奖项移除' : '加入已选奖项'}
                                >
                                  {isAdded ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4d4f">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
                                    </svg>
                                  ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1890ff">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                    </svg>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {searchResults.length > searchPageSize && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderTop: '1px solid #e5e7eb',
                            flexShrink: 0,
                            backgroundColor: '#fff',
                          }}
                        >
                          <Pagination
                            current={searchPage}
                            pageSize={searchPageSize}
                            total={searchResults.length}
                            onChange={setSearchPage}
                            showTotal={false}
                            style={{ justifyContent: 'center' }}
                          />
                        </div>
                      )}
                    </>
                  )
                  ) : awards.length === 0 ? (
                    <ColumnEmptyState
                      title="暂无已选奖项"
                      description="切换到「查询结果」，点击 + 将奖项加入已选奖项"
                    />
                  ) : (
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px 0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {filteredAwards.map((award) => (
                      <div
                        key={award.id}
                        onClick={() => handleSelectAward(award.id)}
                        style={{
                          padding: '11px 16px',
                          cursor: 'pointer',
                          backgroundColor:
                            selectedAwardId === award.id ? '#e6f7ff' : '#fff',
                          borderLeft: selectedAwardId === award.id ? '3px solid #1890ff' : '3px solid transparent',
                          borderBottom: '1px solid #f0f0f0',
                          transition: 'background-color 0.2s ease',
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
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fa8c16">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                          </svg>
                        )}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              color: '#1f2937',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={award.title}
                          >
                            {award.title}
                          </span>
                          {(() => {
                            const totalCount = award.awardType === 'individual'
                              ? (award.recipients?.length || 0)
                              : (award.teams?.length || 0);
                            const selection = awardSelections[award.id];
                            const selectedCount = award.awardType === 'individual'
                              ? selection?.recipientIds?.size || 0
                              : selection?.teamIds?.size || 0;
                            return (
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: selectedCount > 0 ? '#1890ff' : '#9ca3af',
                                  flexShrink: 0,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                ({selectedCount}/{totalCount}{award.awardType === 'individual' ? '人' : '个'})
                              </span>
                            );
                          })()}
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
                    ))}
                    </div>
                  )}
                </div>
                </div>

                {/* 右栏内容区 */}
                <div
                  style={{
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fafbfc',
                  }}
                >
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                    margin: '6px 10px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                {canConfigureRecipients && (
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#f5f7fa',
                        borderRadius: '6px',
                        border: '1px solid #eef0f3',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      <input
                        type="text"
                        placeholder={selectedAward!.awardType === 'individual' ? '获奖人姓名/工号' : '团队名称'}
                        value={recipientSearchKeyword}
                        onChange={(e) => setRecipientSearchKeyword(e.target.value)}
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
                )}
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: canConfigureRecipients ? '8px 0' : 0,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                  }}
                >
                  {!canConfigureRecipients ? (
                    <ColumnEmptyState
                      title={awards.length === 0 ? '等待添加奖项' : '请选择奖项'}
                      description={
                        awards.length === 0
                          ? '在左侧「查询结果」加入奖项后，于「已选奖项」中点击一项继续'
                          : '在左侧「已选奖项」中点击一项，即可勾选获奖人/团队'
                      }
                    />
                  ) : secondColumnData.data.length === 0 ? (
                    <ColumnEmptyState
                      title="该奖项暂无数据"
                      description="请尝试在左侧「已选奖项」中选择其他奖项"
                    />
                  ) : (
                    secondColumnData.data.map((item: any) => {
                      const isIndividual = selectedAward.awardType === 'individual';
                      const itemId = isIndividual ? item.employeeId : item.id;
                      const currentSelection = getCurrentSelection();
                      const isSelected = isIndividual
                        ? currentSelection.recipientIds.has(itemId)
                        : currentSelection.teamIds.has(itemId);

                      return (
                        <div
                          key={itemId}
                          onClick={() => isIndividual ? handleToggleRecipient(selectedAward.id, itemId) : handleToggleTeam(selectedAward.id, itemId)}
                          style={{
                            padding: '10px 20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'background-color 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fafbfc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              border: `2px solid ${isSelected ? '#1890ff' : '#d9d9d9'}`,
                              borderRadius: '3px',
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
                                color: '#1f2937',
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
                                  color: '#9ca3af',
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
                </div>
              </div>
            </div>
          </div>
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
          borderTop: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            style={{
              padding: '8px 24px',
              backgroundColor: '#fff',
              color: '#1a1a2e',
              border: '1px solid #e5e7eb',
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
            disabled={currentStep === 0 ? getTotalSelectedCount() === 0 : false}
            style={{
              padding: '8px 24px',
              backgroundColor: currentStep === 0 && getTotalSelectedCount() === 0 ? '#d1d5db' : '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: currentStep === 0 && getTotalSelectedCount() === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
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
    </div>
  );
}

export default App;
