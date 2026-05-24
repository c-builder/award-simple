import React from 'react';

/** 弹窗表格滚动区最小高度（约 1 行表头 + 10 行数据，对齐默认每页条数） */
export const MODAL_TABLE_MIN_HEIGHT = 380;

export interface PaginationProps {
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
  /** 页码改变回调 */
  onChange: (page: number) => void;
  /** 每页条数改变回调 */
  onPageSizeChange?: (pageSize: number) => void;
  /** 每页条数选项 */
  pageSizeOptions?: number[];
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean;
  /** 是否显示总条数 */
  showTotal?: boolean;
  /** 是否显示每页条数选择器 */
  showPageSize?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 分页器组件
 * 参考 Ant Design 分页组件样式
 */
export const Pagination: React.FC<PaginationProps> = ({
  current,
  pageSize,
  total,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showQuickJumper = false,
  showTotal = true,
  showPageSize = false,
  style = {},
}) => {
  const totalPages = Math.ceil(total / pageSize);

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // 最多显示7个页码

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 复杂分页逻辑
      if (current <= 4) {
        // 当前页在前部
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        // 当前页在后部
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === current) return;
    onChange(page);
  };

  const handleJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(value) && value >= 1 && value <= totalPages) {
        handlePageChange(value);
      }
      (e.target as HTMLInputElement).value = '';
    }
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        padding: '12px 0',
        fontSize: '14px',
        color: '#333',
        ...style,
      }}
    >
      {/* 总条数 */}
      {showTotal && (
        <span style={{ color: '#666', marginRight: '8px', whiteSpace: 'nowrap' }}>
          共 {total} 条
        </span>
      )}

      {/* 每页条数选择器 */}
      {showPageSize && onPageSizeChange && (
        <select
          value={pageSize}
          onChange={(e) => {
            e.stopPropagation();
            onPageSizeChange(Number(e.target.value));
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: '4px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none',
            backgroundColor: '#fff',
          }}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} 条/页
            </option>
          ))}
        </select>
      )}

      {/* 上一页 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePageChange(current - 1);
        }}
        disabled={current === 1}
        style={{
          padding: '5px 12px',
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          cursor: current === 1 ? 'not-allowed' : 'pointer',
          color: current === 1 ? '#d9d9d9' : '#333',
          fontSize: '14px',
          transition: 'all 0.2s',
          minWidth: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          if (current !== 1) {
            e.currentTarget.style.borderColor = '#1890ff';
            e.currentTarget.style.color = '#1890ff';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = current === 1 ? '#d9d9d9' : '#d9d9d9';
          e.currentTarget.style.color = current === 1 ? '#d9d9d9' : '#333';
        }}
        title="上一页"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* 页码 */}
      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span style={{ color: '#999', padding: '0 4px' }}>...</span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePageChange(page as number);
              }}
              style={{
                padding: '5px 12px',
                backgroundColor: current === page ? '#1890ff' : '#fff',
                border: `1px solid ${current === page ? '#1890ff' : '#d9d9d9'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                color: current === page ? '#fff' : '#333',
                fontSize: '14px',
                transition: 'all 0.2s',
                minWidth: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (current !== page) {
                  e.currentTarget.style.borderColor = '#1890ff';
                  e.currentTarget.style.color = '#1890ff';
                }
              }}
              onMouseLeave={(e) => {
                if (current !== page) {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = '#333';
                }
              }}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* 下一页 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePageChange(current + 1);
        }}
        disabled={current === totalPages}
        style={{
          padding: '5px 12px',
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          cursor: current === totalPages ? 'not-allowed' : 'pointer',
          color: current === totalPages ? '#d9d9d9' : '#333',
          fontSize: '14px',
          transition: 'all 0.2s',
          minWidth: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          if (current !== totalPages) {
            e.currentTarget.style.borderColor = '#1890ff';
            e.currentTarget.style.color = '#1890ff';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = current === totalPages ? '#d9d9d9' : '#d9d9d9';
          e.currentTarget.style.color = current === totalPages ? '#d9d9d9' : '#333';
        }}
        title="下一页"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* 快速跳转 */}
      {showQuickJumper && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
          <span style={{ color: '#666' }}>跳至</span>
          <input
            type="text"
            onKeyDown={handleJump}
            style={{
              width: '50px',
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '14px',
              textAlign: 'center',
              outline: 'none',
            }}
          />
          <span style={{ color: '#666' }}>页</span>
        </div>
      )}
    </div>
  );
};

export default Pagination;
