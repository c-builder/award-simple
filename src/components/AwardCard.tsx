import React, { useState } from 'react';
import { Award, Recipient, Team } from './types';
import { RecipientCard } from './RecipientCard';
import { AwardDetailDrawer } from './AwardDetailDrawer';

const MAX_DISPLAY_RECIPIENTS = 10;

export interface AwardCardProps {
  award: Award;
  index?: number;
  currentDepartment?: string;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onAddRecipient?: (allRecipients: Recipient[], selectedRecipients: Recipient[]) => void;
  onRemoveRecipient?: (recipient: Recipient) => void;
  onAddTeam?: () => void;
  onRemoveTeam?: (team: Team) => void;
  onUpdateTeam?: (team: Team) => void;
  onRemoveAward?: () => void;
}

interface TeamCardProps {
  team: Team;
  onRemoveTeam?: (team: Team) => void;
  onShowMembers: (team: Team) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onRemoveTeam,
  onShowMembers,
}) => {
  const [isTeamHovered, setIsTeamHovered] = useState(false);

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        width: 'calc((100% - 48px) / 5)',
        minWidth: 'calc((100% - 48px) / 5)',
        maxWidth: 'calc((100% - 48px) / 5)',
        boxSizing: 'border-box',
        position: 'relative',
        cursor: 'default',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '92px',
      }}
      onMouseEnter={() => setIsTeamHovered(true)}
      onMouseLeave={() => setIsTeamHovered(false)}
    >
      {onRemoveTeam && isTeamHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveTeam(team);
          }}
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

      <div
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#1a1a2e',
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.4',
          maxHeight: '2.8em',
        }}
      >
        {team.name}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '4px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          成员: {team.memberCount}人
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowMembers(team);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#1890ff',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '2px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="编辑成员"
        >
          <span>编辑成员</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const AwardCard: React.FC<AwardCardProps> = ({
  award,
  selected = false,
  onSelect,
  currentDepartment = '',
  onAddRecipient,
  onRemoveRecipient,
  onAddTeam,
  onRemoveTeam,
  onUpdateTeam,
  onRemoveAward,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isTeamAward = award.awardType === 'team';

  const awardCount =
    award.awardCount ??
    (isTeamAward
      ? (award.allTeams?.length ?? award.teams?.length ?? 0)
      : award.recipients.length);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [membersModalVisible, setMembersModalVisible] = useState(false);

  const handleShowMembers = (team: Team) => {
    setSelectedTeam(team);
    setMembersModalVisible(true);
  };

  const handleCloseMembers = () => {
    setMembersModalVisible(false);
    setSelectedTeam(null);
  };

  const filteredRecipients = award.recipients.filter(r => {
    // 只显示选中的获奖人
    if (!r.isSelected) return false;
    if (!currentDepartment) return true;
    const recipientDept = r.department.split('/')[0];
    // 显示当前部门的人员，或手动添加的跨部门人员
    return recipientDept === currentDepartment || r.isManuallyAdded;
  });

  const filteredTeams = award.teams ? (() => {
    if (!currentDepartment) return award.teams;
    // 分离当前部门团队和跨部门团队
    const currentDeptTeams = award.teams.filter(t =>
      t.members?.some(m => {
        const memberDept = m.department.split('/')[0];
        return memberDept === currentDepartment;
      })
    );
    const crossDeptTeams = award.teams.filter(t =>
      t.isManuallyAdded && !t.members?.some(m => {
        const memberDept = m.department.split('/')[0];
        return memberDept === currentDepartment;
      })
    );
    // 当前部门团队排在前面，跨部门团队排在后面
    return [...currentDeptTeams, ...crossDeptTeams];
  })() : undefined;

  // 已选数量 - 只统计当前部门中已选中的团队/人员
  // 对于团队奖，如果当前部门的所有团队都是 isSelected: false（未编辑过），则默认视为全部选中
  const teamSelectedCount = isTeamAward
    ? (() => {
        const currentDeptTeams = filteredTeams || [];
        if (currentDeptTeams.length === 0) return 0;
        // 检查是否所有团队都是 isSelected: false（未编辑状态）
        const allUnselected = currentDeptTeams.every(t => t.isSelected === false);
        if (allUnselected) {
          // 未编辑过，默认全部选中
          return currentDeptTeams.length;
        }
        // 已编辑过，统计实际选中的
        return currentDeptTeams.filter(t => t.isSelected !== false).length;
      })()
    : 0;
  
  const selectedCount = isTeamAward
    ? teamSelectedCount
    : filteredRecipients.filter(r => r.isSelected !== false).length;

  const displayRecipients = filteredRecipients.slice(0, MAX_DISPLAY_RECIPIENTS);
  const hasMoreRecipients = filteredRecipients.length > MAX_DISPLAY_RECIPIENTS;

  const displayTeams = filteredTeams?.slice(0, MAX_DISPLAY_RECIPIENTS);
  const hasMoreTeams = (filteredTeams?.length || 0) > MAX_DISPLAY_RECIPIENTS;

  // 所有选中的获奖人（用于编辑弹框）
  const selectedRecipients = award.recipients.filter(r => r.isSelected);

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e8e8e8',
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {onRemoveAward && isHovered && (
        <button
          onClick={onRemoveAward}
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#ff4d4f',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)',
          }}
          title="删除奖项"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ff7875';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ff4d4f';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* 复选框 */}
          <div
            onClick={() => onSelect?.(!selected)}
            style={{
              width: '18px',
              height: '18px',
              border: `2px solid ${selected ? '#1890ff' : '#d9d9d9'}`,
              borderRadius: '3px',
              backgroundColor: selected ? '#1890ff' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {selected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#1a1a2e',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {award.title}
              <span
                style={{
                  padding: '2px 8px',
                  backgroundColor: isTeamAward ? '#e6f7ff' : '#f0fdf4',
                  color: isTeamAward ? '#1890ff' : '#16a34a',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {isTeamAward ? '团队奖' : '个人奖'}
              </span>
            </h3>
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: '4px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span>颁发部门: {award.issuingDepartment}</span>
              <span>颁奖数: {awardCount}</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '12px',
              color: '#9ca3af',
            }}
          >
            {isTeamAward ? `已选(${selectedCount})` : `已选(${selectedCount})`}
          </span>
        </div>
      </div>

      {isTeamAward ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            {onAddTeam && (
              <button
                onClick={onAddTeam}
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'transparent',
                  color: '#1890ff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>编辑获奖团队</span>
              </button>
            )}
          </div>

          {award.teams && award.teams.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              {displayTeams?.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onRemoveTeam={onRemoveTeam}
                  onShowMembers={handleShowMembers}
                />
              ))}
              {hasMoreTeams && onAddTeam && (
                <button
                  onClick={onAddTeam}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f0f9ff',
                    border: '1px dashed #1890ff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    width: 'calc((100% - 48px) / 5)',
                    minWidth: 'calc((100% - 48px) / 5)',
                    maxWidth: 'calc((100% - 48px) / 5)',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e6f7ff';
                    e.currentTarget.style.borderStyle = 'solid';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                    e.currentTarget.style.borderStyle = 'dashed';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span>等共{filteredTeams?.length}个团队</span>
                    <span style={{ fontWeight: 600 }}>查看全部 →</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            {onAddRecipient && (
              <button
                onClick={() => onAddRecipient(award.recipients, selectedRecipients)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'transparent',
                  color: '#1890ff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>编辑获奖人</span>
              </button>
            )}
          </div>

          {award.recipients.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              {displayRecipients.map((recipient, index) => (
                <RecipientCard
                  key={`${recipient.employeeId || recipient.name}-${index}`}
                  recipient={recipient}
                  issuingDepartment={award.issuingDepartment}
                  currentDepartment={currentDepartment}
                  onRemove={
                    onRemoveRecipient ? () => onRemoveRecipient(recipient) : undefined
                  }
                />
              ))}

              {hasMoreRecipients && onAddRecipient && (
                <button
                  onClick={() => onAddRecipient(award.recipients, selectedRecipients)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f0f9ff',
                    border: '1px dashed #1890ff',
                    borderRadius: '6px',
                    color: '#1890ff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    width: 'calc((100% - 48px) / 5)',
                    minWidth: 'calc((100% - 48px) / 5)',
                    maxWidth: 'calc((100% - 48px) / 5)',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e6f7ff';
                    e.currentTarget.style.borderStyle = 'solid';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                    e.currentTarget.style.borderStyle = 'dashed';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span>等共{filteredRecipients.length}人</span>
                    <span style={{ fontWeight: 600 }}>查看全部 →</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </>
      )}

      <AwardDetailDrawer
        visible={membersModalVisible}
        onClose={handleCloseMembers}
        mode="team"
        team={selectedTeam || undefined}
        awardTitle={award.title}
        showSearch
        onSelectionChange={(selectedMemberIds) => {
          if (selectedTeam && onUpdateTeam) {
            // 更新团队成员的选中状态
            const updatedMembers = selectedTeam.members?.map(member => ({
              ...member,
              isSelected: selectedMemberIds.includes(member.employeeId),
            })) || [];
            
            const updatedTeam: Team = {
              ...selectedTeam,
              members: updatedMembers,
              memberCount: updatedMembers.filter(m => m.isSelected !== false).length,
            };
            
            onUpdateTeam(updatedTeam);
          }
        }}
      />
    </div>
  );
};

export default AwardCard;
