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
        padding: '24px 20px',
        textAlign: 'center',
        minHeight: 0,
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
            maxWidth: '280px',
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}

type AwardSelectionsMap = Record<string, { recipientIds: Set<string>; teamIds: Set<string> }>;

function getAwardSelectionCount(award: Award, selections: AwardSelectionsMap) {
  const sel = selections[award.id];
  if (award.awardType === 'individual') {
    return {
      selected: sel?.recipientIds?.size ?? 0,
      total: award.recipients?.length ?? 0,
    };
  }
  return {
    selected: sel?.teamIds?.size ?? 0,
    total: award.teams?.length ?? 0,
  };
}

function App() {
  const [currentStep, setCurrentStep] = useState(0);

  const [awards, setAwards] = useState<Award[]>([]);

  // 当前选中的奖项ID
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');

  // 搜索关键词
  const [awardSearchKeyword, setAwardSearchKeyword] = useState('');
  const [recipientSearchKeyword, setRecipientSearchKeyword] = useState('');

  // 从左侧加入已选后的短暂高亮
  const [highlightAwardId, setHighlightAwardId] = useState('');

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
    setAwards(prev => [...prev, award]);
    setHighlightAwardId(award.id);
    window.setTimeout(() => setHighlightAwardId(''), 1500);
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

  const getDetailPaneTitle = () => {
    if (!selectedAward) return '选择获奖对象';
    return selectedAward.awardType === 'individual' ? '选择获奖人' : '选择团队';
  };

  const handleToggleSelectAll = () => {
    if (!selectedAward || secondColumnData.data.length === 0) return;
    const allIds = secondColumnData.data.map((item: { employeeId?: string; id?: string }) =>
      selectedAward.awardType === 'individual' ? item.employeeId! : item.id!
    );
    const currentSelection = getCurrentSelection();
    const allSelected = allIds.every((id: string) =>
      selectedAward.awardType === 'individual'
        ? currentSelection.recipientIds.has(id)
        : currentSelection.teamIds.has(id)
    );
    setAwardSelections(prev => {
      const current = prev[selectedAward.id] || { recipientIds: new Set(), teamIds: new Set() };
      const newRecipientIds = new Set(current.recipientIds);
      const newTeamIds = new Set(current.teamIds);
      if (selectedAward.awardType === 'individual') {
        allIds.forEach((id: string) => (allSelected ? newRecipientIds.delete(id) : newRecipientIds.add(id)));
      } else {
        allIds.forEach((id: string) => (allSelected ? newTeamIds.delete(id) : newTeamIds.add(id)));
      }
      return {
        ...prev,
        [selectedAward.id]: { recipientIds: newRecipientIds, teamIds: newTeamIds },
      };
    });
  };

  const configuredAwardsCount = useMemo(
    () => awards.filter(a => getAwardSelectionCount(a, awardSelections).selected > 0).length,
    [awards, awardSelections]
  );

  const detailSelectionStats = useMemo(() => {
    if (!selectedAward) return { selected: 0, total: 0, allSelected: false };
    const { selected, total } = getAwardSelectionCount(selectedAward, awardSelections);
    const filteredTotal = secondColumnData.data.length;
    const currentSelection = awardSelections[selectedAward.id] || {
      recipientIds: new Set<string>(),
      teamIds: new Set<string>(),
    };
    const allSelected =
      filteredTotal > 0 &&
      secondColumnData.data.every((item: { employeeId?: string; id?: string }) => {
        const id = selectedAward.awardType === 'individual' ? item.employeeId! : item.id!;
        return selectedAward.awardType === 'individual'
          ? currentSelection.recipientIds.has(id)
          : currentSelection.teamIds.has(id);
      });
    return { selected, total, filteredTotal, allSelected };
  }, [selectedAward, awardSelections, secondColumnData.data]);

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
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                  alignItems: 'stretch',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#eef2f6',
                  boxSizing: 'border-box',
                }}
              >
              {/* 第一列：查询奖项（40%） */}
              <div
                style={{
                  flex: '2 1 0',
                  minWidth: 0,
                  minHeight: 0,
                  alignSelf: 'stretch',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '57px',
                    boxSizing: 'border-box',
                  }}
                >
                  <span>查询奖项</span>
                  {hasSearched && (
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 400 }}>
                      共 <strong style={{ color: '#1890ff', fontWeight: 600 }}>{searchResults.length}</strong> 条
                    </span>
                  )}
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                  }}
                >
                  {!hasSearched ? (
                    <ColumnEmptyState
                      title="尚未查询"
                      description="设置筛选条件后，点击上方「查询」获取奖项列表"
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
                                <span style={{ width: '40px', flexShrink: 0, textAlign: 'center' }} title="加入已选">操作</span>
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
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #e5e7eb',
                                transition: 'background-color 0.2s',
                                backgroundColor: isAdded ? '#f0fdf4' : '#fff',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isAdded ? '#f0fdf4' : '#e6f7ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isAdded ? '#f0fdf4' : '#fff';
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
                                  title={isAdded ? '从已选移除' : '加入已选'}
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
                  )}
                </div>
              </div>

              {/* 第二列：配置获奖对象（Master-Detail） */}
              <div
                style={{
                  flex: '3 1 0',
                  minWidth: 0,
                  minHeight: 0,
                  alignSelf: 'stretch',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    padding: '0 16px',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    height: '57px',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', flexShrink: 0 }}>
                      配置获奖对象
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {awards.length} 个奖项 · {configuredAwardsCount} 已配置 · 共选{' '}
                      <strong style={{ color: '#1890ff', fontWeight: 600 }}>{getTotalSelectedCount()}</strong> 人/团队
                    </span>
                  </div>
                  {awards.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllAwards}
                      style={{
                        fontSize: '13px',
                        color: '#ff4d4f',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      清空全部
                    </button>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                  {awards.length === 0 ? (
                    <ColumnEmptyState
                      title="等待添加奖项"
                      description="请先从左侧「查询奖项」中点击 + 将奖项加入列表"
                    />
                  ) : (
                    <>
                  <aside
                    style={{
                      flex: '0 0 280px',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0,
                      backgroundColor: '#f7f8fa',
                      borderRight: '1px solid #e5e7eb',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 12px 6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#6b7280',
                        letterSpacing: '0.02em',
                      }}
                    >
                      已选奖项
                    </div>
                    <div
                      style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '4px 10px 10px',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {filteredAwards.length === 0 ? (
                        <ColumnEmptyState
                          title="无匹配奖项"
                          description="当前筛选条件下未找到已选奖项"
                        />
                      ) : (
                        filteredAwards.map((award) => {
                          const { selected, total } = getAwardSelectionCount(award, awardSelections);
                          const isActive = selectedAwardId === award.id;
                          const isComplete = total > 0 && selected === total;
                          const progressPct = total > 0 ? Math.round((selected / total) * 100) : 0;
                          return (
                            <div
                              key={award.id}
                              onClick={() => handleSelectAward(award.id)}
                              style={{
                                marginBottom: '8px',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                border: isActive ? '1px solid #1890ff' : '1px solid #e5e7eb',
                                backgroundColor:
                                  highlightAwardId === award.id
                                    ? '#fffbe6'
                                    : isActive
                                      ? '#fff'
                                      : '#fff',
                                boxShadow: isActive ? '0 2px 8px rgba(24, 144, 255, 0.12)' : 'none',
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
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <span
                                  style={{
                                    flexShrink: 0,
                                    marginTop: '2px',
                                    padding: '1px 6px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    backgroundColor: award.awardType === 'individual' ? '#e6f7ff' : '#fff7e6',
                                    color: award.awardType === 'individual' ? '#1890ff' : '#fa8c16',
                                  }}
                                >
                                  {award.awardType === 'individual' ? '个人' : '团队'}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: isActive ? 600 : 400,
                                      color: '#1f2937',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={award.title}
                                  >
                                    {award.title}
                                  </div>
                                  <div
                                    style={{
                                      marginTop: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '8px',
                                    }}
                                  >
                                    <div
                                      style={{
                                        flex: 1,
                                        height: '4px',
                                        borderRadius: '2px',
                                        backgroundColor: '#e5e7eb',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${progressPct}%`,
                                          height: '100%',
                                          borderRadius: '2px',
                                          backgroundColor: isComplete ? '#52c41a' : selected > 0 ? '#1890ff' : 'transparent',
                                          transition: 'width 0.2s',
                                        }}
                                      />
                                    </div>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        color: isComplete ? '#52c41a' : selected > 0 ? '#1890ff' : '#9ca3af',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {selected}/{total}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAward(award.id);
                                }}
                                className="delete-award-btn"
                                title="移除奖项"
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  backgroundColor: '#fff1f0',
                                  color: '#ff4d4f',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  lineHeight: 1,
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
                  </aside>

              <section
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  alignItems: 'stretch',
                  justifyContent: 'stretch',
                }}
              >
                {!canConfigureRecipients ? (
                  <ColumnEmptyState
                    title="请选择奖项"
                    description="在左侧列表选中一个奖项，在此勾选获奖人/团队"
                  />
                ) : (
                  <>
                    <div
                      style={{
                        flexShrink: 0,
                        padding: '14px 16px 12px',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                            {getDetailPaneTitle()}
                          </div>
                          <div
                            style={{
                              marginTop: '4px',
                              fontSize: '12px',
                              color: '#6b7280',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={selectedAward!.title}
                          >
                            {selectedAward!.title}
                          </div>
                        </div>
                        <span
                          style={{
                            flexShrink: 0,
                            padding: '2px 8px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            backgroundColor:
                              detailSelectionStats.selected === detailSelectionStats.total && detailSelectionStats.total > 0
                                ? '#f6ffed'
                                : '#e6f7ff',
                            color:
                              detailSelectionStats.selected === detailSelectionStats.total && detailSelectionStats.total > 0
                                ? '#52c41a'
                                : '#1890ff',
                          }}
                        >
                          已选 {detailSelectionStats.selected}/{detailSelectionStats.filteredTotal}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        flexShrink: 0,
                        padding: '10px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                          type="text"
                          placeholder={
                            selectedAward!.awardType === 'individual' ? '搜索姓名或工号' : '搜索团队名称'
                          }
                          value={recipientSearchKeyword}
                          onChange={(e) => setRecipientSearchKeyword(e.target.value)}
                          style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            fontSize: '13px',
                            outline: 'none',
                            minWidth: 0,
                          }}
                        />
                      </div>
                      {secondColumnData.data.length > 0 && (
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            color: '#374151',
                            cursor: 'pointer',
                            flexShrink: 0,
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={detailSelectionStats.allSelected}
                            onChange={handleToggleSelectAll}
                            style={{ width: '16px', height: '16px', accentColor: '#1890ff', cursor: 'pointer' }}
                          />
                          全选
                        </label>
                      )}
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                      {secondColumnData.data.length === 0 ? (
                        <ColumnEmptyState
                          title="无匹配结果"
                          description="请调整搜索关键词，或切换其他奖项"
                        />
                      ) : (
                        <>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: '#9ca3af',
                              borderBottom: '1px solid #f0f0f0',
                              position: 'sticky',
                              top: 0,
                              backgroundColor: '#fff',
                              zIndex: 1,
                            }}
                          >
                            <span style={{ width: '18px', flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>
                              {selectedAward!.awardType === 'individual' ? '姓名' : '团队名称'}
                            </span>
                            {selectedAward!.awardType === 'individual' && (
                              <span style={{ width: '120px', flexShrink: 0 }}>部门</span>
                            )}
                          </div>
                          {secondColumnData.data.map((item: { employeeId?: string; id?: string; name: string; department?: string }) => {
                            const isIndividual = selectedAward!.awardType === 'individual';
                            const itemId = isIndividual ? item.employeeId! : item.id!;
                            const currentSelection = getCurrentSelection();
                            const isSelected = isIndividual
                              ? currentSelection.recipientIds.has(itemId)
                              : currentSelection.teamIds.has(itemId);

                            return (
                              <div
                                key={itemId}
                                onClick={() =>
                                  isIndividual
                                    ? handleToggleRecipient(selectedAward!.id, itemId)
                                    : handleToggleTeam(selectedAward!.id, itemId)
                                }
                                style={{
                                  padding: '10px 16px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  backgroundColor: isSelected ? '#f0f7ff' : 'transparent',
                                  borderBottom: '1px solid #f9fafb',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = '#fafafa';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isSelected ? '#f0f7ff' : 'transparent';
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    flexShrink: 0,
                                    accentColor: '#1890ff',
                                    pointerEvents: 'none',
                                  }}
                                />
                                <span
                                  style={{
                                    flex: 1,
                                    fontSize: '14px',
                                    color: '#1f2937',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={item.name}
                                >
                                  {item.name}
                                </span>
                                {isIndividual && (
                                  <span
                                    style={{
                                      width: '120px',
                                      flexShrink: 0,
                                      fontSize: '12px',
                                      color: '#9ca3af',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={item.department}
                                  >
                                    {item.department}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </>
                )}
              </section>
                    </>
                  )}
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
