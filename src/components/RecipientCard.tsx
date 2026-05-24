import React, { useState } from 'react';
import { Recipient } from './types';

export interface RecipientCardProps {
  recipient: Recipient;
  issuingDepartment: string;
  currentDepartment?: string;
  onRemove?: () => void;
}

/**
 * 获奖人卡片组件
 * 显示获奖人姓名、工号、部门信息
 * 样式与团队奖卡片保持一致
 * 一行最多显示6个卡片
 */
export const RecipientCard: React.FC<RecipientCardProps> = ({
  recipient,
  issuingDepartment,
  currentDepartment = '',
  onRemove,
}) => {
  // 判断是否为跨部门人员：获奖人的一级部门 ≠ 当前选择的部门
  // 如果没有指定当前部门，则与颁发部门的一级部门比较
  const isCrossDepartment = currentDepartment
    ? recipient.department.split('/')[0] !== currentDepartment
    : recipient.department.split('/')[0] !== issuingDepartment.split('/')[0];

  // 鼠标悬停状态
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`recipient-card ${isCrossDepartment ? 'cross-department' : ''}`}
      style={{
        position: 'relative',
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        width: 'calc((100% - 48px) / 5)',
        minWidth: 'calc((100% - 48px) / 5)',
        maxWidth: 'calc((100% - 48px) / 5)',
        boxSizing: 'border-box',
        cursor: 'default',
        transition: 'all 0.2s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 删除按钮 - 鼠标悬停时显示（右上角） */}
      {onRemove && isHovered && (
        <button
          className="recipient-remove-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="删除"
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ff7875';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>
      )}

      {/* 跨部门标记 - 右下角 */}
      {isCrossDepartment && (
        <span
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            padding: '1px 4px',
            backgroundColor: '#1890ff',
            color: '#fff',
            fontSize: '9px',
            fontWeight: 600,
            borderRadius: '3px',
            zIndex: 5,
            boxShadow: '0 1px 3px rgba(24, 144, 255, 0.3)',
          }}
        >
          跨
        </span>
      )}

      {/* 姓名和工号同一行 */}
      <div
        className="recipient-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
        }}
      >
        <span
          className="recipient-name"
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#1a1a2e',
          }}
        >
          {recipient.name}
        </span>
        <span
          style={{
            fontSize: '12px',
            color: '#6b7280',
            fontFamily: 'monospace',
          }}
        >
          {recipient.employeeId}
        </span>
      </div>

      {/* 部门 - 超长使用省略号 */}
      <div
        className="recipient-department"
        style={{
          fontSize: '12px',
          color: '#6b7280',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          display: 'block',
        }}
        title={recipient.department}
      >
        {recipient.department}
      </div>
    </div>
  );
};

export default RecipientCard;
