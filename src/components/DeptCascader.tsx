import React, { useState, useRef, useEffect } from 'react';

export interface DeptCascaderProps {
  value?: string[];
  onChange?: (value: string[], path: string[]) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

// 多级部门数据结构
export interface DepartmentNode {
  name: string;
  children?: DepartmentNode[];
}

// 默认部门数据
export const defaultDepartmentTree: DepartmentNode[] = [
  {
    name: '数字金融服务部',
    children: [
      {
        name: '支付平台部',
        children: [
          { name: '支付开发组' },
          { name: '支付运维组' },
          { name: '风控算法组' },
        ],
      },
      {
        name: '信贷产品部',
        children: [
          { name: '信贷开发组' },
          { name: '信贷风控组' },
          { name: '个人信贷组' },
        ],
      },
      {
        name: '反欺诈中心',
        children: [
          { name: '欺诈识别组' },
          { name: '案件处置组' },
          { name: '行为分析组' },
        ],
      },
    ],
  },
  {
    name: '智能制造研究院',
    children: [
      {
        name: '工业软件部',
        children: [
          { name: 'PLM研发组' },
          { name: 'MES研发组' },
          { name: '仿真平台组' },
        ],
      },
      {
        name: '自动化装备部',
        children: [
          { name: '机器人控制组' },
          { name: '视觉检测组' },
          { name: '运动控制组' },
        ],
      },
      {
        name: '数字工厂部',
        children: [
          { name: '数据中台组' },
          { name: '智能调度组' },
          { name: '工艺优化组' },
        ],
      },
    ],
  },
  {
    name: '新能源技术中心',
    children: [
      {
        name: '电池研发部',
        children: [
          { name: '材料研究组' },
          { name: '电池结构组' },
          { name: '性能测试组' },
        ],
      },
      {
        name: '电控系统部',
        children: [
          { name: 'BMS算法组' },
          { name: '整车控制组' },
          { name: '电驱开发组' },
        ],
      },
      {
        name: '充电网络部',
        children: [
          { name: '充电协议组' },
          { name: '运营平台组' },
          { name: '桩端硬件组' },
        ],
      },
    ],
  },
  {
    name: '医疗健康事业部',
    children: [
      {
        name: '影像产品部',
        children: [
          { name: 'CT研发组' },
          { name: 'MR研发组' },
          { name: 'AI算法组' },
        ],
      },
      {
        name: '临床信息部',
        children: [
          { name: 'HIS研发组' },
          { name: '移动护理组' },
          { name: '互联网医疗组' },
        ],
      },
      {
        name: '数据合规部',
        children: [
          { name: '隐私保护组' },
          { name: '合规审计组' },
          { name: '数据治理组' },
        ],
      },
    ],
  },
  {
    name: '国际化业务部',
    children: [
      {
        name: '海外营销部',
        children: [
          { name: '欧洲市场组' },
          { name: '北美市场组' },
          { name: '亚太市场组' },
        ],
      },
      {
        name: '跨境物流部',
        children: [
          { name: '海外仓储组' },
          { name: '国际配送组' },
          { name: '物流网络组' },
        ],
      },
      {
        name: '合规事务部',
        children: [
          { name: '海外法务组' },
          { name: '关务通关组' },
          { name: '税务筹划组' },
        ],
      },
    ],
  },
  {
    name: '创新孵化中心',
    children: [
      {
        name: '前沿技术实验室',
        children: [
          { name: 'AIGC实验组' },
          { name: '量子计算组' },
          { name: '区块链组' },
        ],
      },
      {
        name: '战略投资部',
        children: [
          { name: '行业投研组' },
          { name: '投后管理组' },
          { name: '并购整合组' },
        ],
      },
      {
        name: '生态合作部',
        children: [
          { name: '开发者关系组' },
          { name: '联合实验室组' },
          { name: '开源运营组' },
        ],
      },
    ],
  },
];

export const DeptCascader: React.FC<DeptCascaderProps> = ({
  value = [],
  onChange,
  placeholder = '请选择部门',
  className = '',
  style = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setCurrentPath([]);
        setSearchKeyword('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 打开时聚焦搜索框
  useEffect(() => {
    if (isOpen && searchInputRef.current && currentPath.length === 0) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, currentPath.length]);

  // 获取当前层级的部门
  const getCurrentLevelDepts = (): { node: DepartmentNode; path: string[] }[] => {
    let current = defaultDepartmentTree;
    const path: string[] = [];

    for (const deptName of currentPath) {
      const found = current.find(d => d.name === deptName);
      if (found?.children) {
        current = found.children;
        path.push(deptName);
      }
    }

    return current.map(node => ({
      node,
      path: [...path, node.name],
    }));
  };

  // 搜索部门
  const searchDepartments = (): { node: DepartmentNode; path: string[] }[] => {
    const results: { node: DepartmentNode; path: string[] }[] = [];

    const searchRecursive = (nodes: DepartmentNode[], currentPath: string[]) => {
      for (const node of nodes) {
        const newPath = [...currentPath, node.name];
        if (node.name.toLowerCase().includes(searchKeyword.toLowerCase())) {
          results.push({ node, path: newPath });
        }
        if (node.children) {
          searchRecursive(node.children, newPath);
        }
      }
    };

    searchRecursive(defaultDepartmentTree, []);
    return results;
  };

  const displayDepts = currentPath.length === 0 && searchKeyword
    ? searchDepartments()
    : getCurrentLevelDepts();

  const handleDeptClick = (_dept: string, hasChildren: boolean, path: string[]) => {
    if (hasChildren) {
      setCurrentPath(path);
      setSearchKeyword('');
    } else {
      // 传递完整路径，而不仅仅是最后一级
      onChange?.(path, path);
      setIsOpen(false);
      setCurrentPath([]);
      setSearchKeyword('');
    }
  };

  const handleBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
      setSearchKeyword('');
    }
  };

  const handleSelectCurrent = () => {
    if (currentPath.length > 0) {
      // 传递完整路径
      onChange?.(currentPath, currentPath);
      setIsOpen(false);
      setCurrentPath([]);
      setSearchKeyword('');
    }
  };

  const getDisplayText = () => {
    if (value.length === 0) {
      return placeholder;
    }
    // 显示完整路径，如 "质量与流程IT部/流程部"
    return value.join('/');
  };

  return (
    <div
      ref={containerRef}
      className={`dept-cascader ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      {/* 触发器 */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          color: value.length === 0 ? '#999' : '#333',
          transition: 'all 0.2s',
          minWidth: '140px',
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {getDisplayText()}
        </span>
        <span
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            fontSize: '12px',
            color: '#666',
          }}
        >
          ▼
        </span>
      </div>

      {/* 下拉面板 */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            width: '240px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 头部 */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {currentPath.length > 0 && (
              <button
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#666',
                  padding: '0',
                }}
              >
                ‹
              </button>
            )}
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
              title={currentPath.length > 0 ? currentPath.join(' / ') : '选择部门'}
            >
              {currentPath.length > 0 ? currentPath.join(' / ') : '选择部门'}
            </span>
          </div>

          {/* 搜索框 */}
          {currentPath.length === 0 && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="搜索部门..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '13px',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
              />
            </div>
          )}

          {/* 部门列表 */}
          <div style={{ maxHeight: '240px', overflow: 'auto' }}>
            {displayDepts.length > 0 ? (
              displayDepts.map(({ node, path }) => {
                const hasChildren = node.children && node.children.length > 0;
                const isSelected = value.join('/') === path.join('/');

                return (
                  <div
                    key={node.name}
                    onClick={() => handleDeptClick(node.name, !!hasChildren, path)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: isSelected ? '#1890ff' : '#333',
                      backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                      transition: 'all 0.2s',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#fff';
                      }
                    }}
                    title={path.join(' / ')}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {currentPath.length === 0 && searchKeyword ? (
                        <span>
                          <span style={{ color: '#999' }}>{path.slice(0, -1).join(' / ')}</span>
                          {path.length > 1 && <span style={{ color: '#999' }}> / </span>}
                          <span>{node.name}</span>
                        </span>
                      ) : (
                        node.name
                      )}
                    </span>
                    {hasChildren && (
                      <span style={{ fontSize: '16px', color: '#999', marginLeft: '8px', fontWeight: 500 }}>›</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '20px 12px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '13px',
                }}
              >
                未找到匹配的部门
              </div>
            )}
          </div>

          {/* 选择当前部门按钮 */}
          {currentPath.length > 0 && (
            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
              }}
            >
              <button
                onClick={handleSelectCurrent}
                style={{
                  width: '100%',
                  padding: '6px 0',
                  backgroundColor: '#1890ff',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                选择: {currentPath[currentPath.length - 1]}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeptCascader;
