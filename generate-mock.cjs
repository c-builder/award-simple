// 生成更真实的OCC奖项mock数据
// 质量与流程IT部的团队为主，少量跨部门团队

const fs = require('fs');

// 质量与流程IT部的成员
const qualityMembers = [
  { name: '张三', employeeId: '00501234', dept: '质量与流程IT部/质量部/测试组' },
  { name: '钱七', employeeId: '00502222', dept: '质量与流程IT部/流程部/优化组' },
  { name: '郑十一', employeeId: '00506666', dept: '质量与流程IT部/IT部/开发组' },
  { name: '褚十五', employeeId: '00510000', dept: '质量与流程IT部/质量部/测试组' },
  { name: '韩十九', employeeId: '00514444', dept: '质量与流程IT部/流程部/优化组' },
  { name: '袁六三', employeeId: '00558888', dept: '质量与流程IT部/IT部/开发组' },
  { name: '史六七', employeeId: '00562222', dept: '质量与流程IT部/质量部/测试组' },
  { name: '岑七一', employeeId: '00566666', dept: '质量与流程IT部/流程部/优化组' },
  { name: '雷七五', employeeId: '00572222', dept: '质量与流程IT部/IT部/开发组' },
  { name: '贺七九', employeeId: '00578888', dept: '质量与流程IT部/质量部/测试组' },
];

// IT平台服务部的成员（少量）
const itPlatformMembers = [
  { name: '李水花', employeeId: '00494097', dept: 'IT平台服务部/平台开发部' },
  { name: '吴十', employeeId: '00505555', dept: 'IT平台服务部/平台开发部' },
  { name: '赵六', employeeId: '00501111', dept: 'IT平台服务部/平台运维部' },
  { name: '陈十四', employeeId: '00509999', dept: 'IT平台服务部/平台开发部' },
  { name: '沈十八', employeeId: '00513333', dept: 'IT平台服务部/平台运维部' },
];

// 其他部门成员（少量）
const otherMembers = [
  { name: '李四', employeeId: '00505678', dept: '智能汽车解决方案部/智能驾驶组' },
  { name: '王五', employeeId: '00507890', dept: '云与计算业务部/云计算组' },
  { name: '孙八', employeeId: '00503333', dept: '智能汽车解决方案部/智能座舱组' },
  { name: '周九', employeeId: '00504444', dept: '云与计算业务部/大数据组' },
];

// 团队名称列表
const teamNames = [
  '新员工OCC实践培训优秀团队',
  'CIO值班优秀团队',
  'OCC委员会和OCC运营大会组织优秀团队',
  'OCC模式复制构建及推广优秀团队',
  'OCC应急响应优秀团队',
  'OCC监控平台建设优秀团队',
  'OCC流程优化优秀团队',
  'OCC数据分析优秀团队',
  'OCC安全运维优秀团队',
  'OCC自动化运维优秀团队',
  'OCC容量规划优秀团队',
  'OCC故障演练优秀团队',
  'OCC变更管理优秀团队',
  'OCC事件管理优秀团队',
  'OCC问题管理优秀团队',
  'OCC配置管理优秀团队',
  'OCC发布管理优秀团队',
  'OCC服务台优秀团队',
  'OCC知识管理优秀团队',
  'OCC供应商管理优秀团队',
  'OCC资产管理优秀团队',
  'OCC可用性管理优秀团队',
  'OCC连续性管理优秀团队',
  'OCC容量优化优秀团队',
  'OCC性能优化优秀团队',
  'OCC监控告警优化优秀团队',
  'OCC日志分析优秀团队',
  'OCC报表开发优秀团队',
  'OCC值班管理优秀团队',
  'OCC交接管理优秀团队',
  'OCC文档管理优秀团队',
  'OCC培训体系建设优秀团队',
  'OCC考核评价优秀团队',
  'OCC激励机制建设优秀团队',
  'OCC沟通协调优秀团队',
  'OCC会议组织优秀团队',
  'OCC信息报送优秀团队',
  'OCC风险管控优秀团队',
  'OCC合规管理优秀团队',
  'OCC审计配合优秀团队',
  'OCC成本控制优秀团队',
  'OCC预算管理优秀团队',
  'OCC资源调度优秀团队',
  'OCC项目支持优秀团队',
  'OCC业务对接优秀团队',
  'OCC技术攻关优秀团队',
  'OCC创新实践优秀团队',
  'OCC数字化转型优秀团队',
  'OCC智能化运维优秀团队',
  'OCC生态建设优秀团队',
];

// 生成团队成员
function generateTeamMembers(teamIndex, isCrossDept = false) {
  const members = [];
  const memberCount = 6 + Math.floor(Math.random() * 7); // 6-12人
  
  // 主要负责人（质量与流程IT部）
  const leader = qualityMembers[teamIndex % qualityMembers.length];
  members.push({
    name: leader.name,
    employeeId: leader.employeeId,
    department: leader.dept,
    role: '组长'
  });
  
  // 其他成员
  for (let i = 1; i < memberCount; i++) {
    let member;
    if (isCrossDept && i < 3) {
      // 跨部门团队包含少量其他部门成员
      const otherPool = [...itPlatformMembers, ...otherMembers];
      member = otherPool[Math.floor(Math.random() * otherPool.length)];
    } else {
      // 主要是质量与流程IT部成员
      member = qualityMembers[(teamIndex + i) % qualityMembers.length];
    }
    
    // 避免重复
    if (!members.find(m => m.employeeId === member.employeeId)) {
      members.push({
        name: member.name,
        employeeId: member.employeeId,
        department: member.dept
      });
    }
  }
  
  return members;
}

// 生成所有团队
const teams = [];
for (let i = 0; i < teamNames.length; i++) {
  // 前10个团队是跨部门的（包含IT平台服务部等其他部门）
  // 后40个团队完全是质量与流程IT部的
  const isCrossDept = i < 10;
  const members = generateTeamMembers(i, isCrossDept);
  
  teams.push({
    id: `team-${String(i + 1).padStart(3, '0')}`,
    name: teamNames[i],
    memberCount: members.length,
    isSelected: false,
    members: members
  });
}

console.log(JSON.stringify(teams, null, 2));
