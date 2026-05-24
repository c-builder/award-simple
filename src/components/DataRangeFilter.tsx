import React, { useState, useRef, useEffect } from 'react';

export interface DataRangeFilterProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  /** 当前用户有权限查看的部门列表 */
  accessibleDepartments?: string[];
  /** 当前用户所属部门 */
  currentUserDepartment?: string;
}

export const DataRangeFilter: React.FC<DataRangeFilterProps> = ({
  value,
  onChange,
  className = '',
  accessibleDepartments = [],
  currentUserDepartment = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasMultipleDepartments = accessibleDepartments.length > 1;

  const selectedLabel = value === 'all' 
    ? '全部部门' 
    : value || currentUserDepartment || '请选择部门';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (dept: string) => {
    onChange?.(dept);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`data-range-filter ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <div
        className="data-range-trigger"
        onClick={() => {
          if (hasMultipleDepartments) {
            setIsOpen(!isOpen);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          cursor: hasMultipleDepartments ? 'pointer' : 'default',
          fontSize: '14px',
          color: '#333',
          transition: 'all 0.2s',
          minWidth: '200px',
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span style={{ color: '#666', whiteSpace: 'nowrap' }}>部门:</span>
        <span
          style={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '200px',
            flex: 1,
          }}
        >
          {selectedLabel}
        </span>
        {hasMultipleDepartments && (
          <span
            style={{
              marginLeft: '4px',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: '12px',
              color: '#666',
            }}
          >
            ▼
          </span>
        )}
      </div>

      {isOpen && hasMultipleDepartments && (
        <div
          className="data-range-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '200px',
          }}
          role="listbox"
        >
          {accessibleDepartments.map((dept) => (
            <div
              key={dept}
              className={`data-range-option ${value === dept ? 'selected' : ''}`}
              onClick={() => handleSelect(dept)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                color: value === dept ? '#1890ff' : '#333',
                backgroundColor: value === dept ? '#e6f7ff' : '#fff',
                transition: 'all 0.2s',
                borderBottom: '1px solid #f0f0f0',
              }}
              onMouseEnter={(e) => {
                if (value !== dept) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== dept) {
                  e.currentTarget.style.backgroundColor = '#fff';
                }
              }}
              role="option"
              aria-selected={value === dept}
            >
              {dept}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataRangeFilter;
