/**
 * 获奖人信息
 */
export interface Recipient {
  name: string;
  employeeId: string;
  department: string;
  /** 是否被选中 */
  isSelected?: boolean;
  /** 是否为手动添加的跨部门人员 */
  isManuallyAdded?: boolean;
}

/**
 * 团队成员信息
 */
export interface TeamMember {
  name: string;
  employeeId: string;
  department: string;
  role?: string;
  isSelected?: boolean;
}

/**
 * 团队信息
 */
export interface Team {
  id: string;
  name: string;
  leaderName?: string;
  leaderId?: string;
  memberCount: number;
  members?: TeamMember[];
  /** 是否被选中 */
  isSelected?: boolean;
  /** 是否为手动添加的跨部门团队 */
  isManuallyAdded?: boolean;
}

/**
 * 奖项类型
 */
export type AwardType = 'individual' | 'team';

/**
 * 奖项信息
 */
export interface Award {
  id: string;
  title: string;
  issuingDepartment: string;
  awardType: AwardType;
  recipients: Recipient[];
  teams?: Team[];
  /** 
   * 所有可选的团队列表（用于编辑弹框显示）
   * 保存时只更新 teams，allTeams 保持不变
   */
  allTeams?: Team[];
  /** 是否被选中用于展播 */
  selected?: boolean;
  /** 
   * 是否为默认推送数据
   * - true: 首页首次加载时加载的近期数据，不允许删除
   * - false: 通过"添加展播奖项"弹框自定义添加的奖项，支持删除
   */
  isDefault?: boolean;
  /** 
   * 推送日期，用于判断是否为近期数据
   * 格式: YYYY-MM-DD
   * 由 issueDate 决定是否为默认推送数据
   */
  pushDate?: string;
  /** 
   * 奖项颁发日期
   * 格式: YYYY-MM-DD
   */
  issueDate?: string;
  /**
   * 颁奖数量（奖项官方统计数，不随编辑或部门筛选变化）
   */
  awardCount?: number;
}
