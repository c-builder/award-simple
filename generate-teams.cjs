// 生成正确的OCC奖项mock数据 - 每个团队只属于一个部门
const fs = require('fs');

// 各部门成员池
const departmentMembers = {
  '质量与流程IT部': [
    { name: '张三', employeeId: '00501234' },
    { name: '钱七', employeeId: '00502222' },
    { name: '郑十一', employeeId: '00506666' },
    { name: '褚十五', employeeId: '00510000' },
    { name: '韩十九', employeeId: '00514444' },
  ],
  'IT平台服务部': [
    { name: '李水花', employeeId: '00494097' },
    { name: '吴十', employeeId: '00505555' },
    { name: '赵六', employeeId: '00501111' },
    { name: '陈十四', employeeId: '00509999' },
    { name: '沈十八', employeeId: '00513333' },
  ],
  '智能汽车解决方案部': [
    { name: '李四', employeeId: '00505678' },
    { name: '孙八', employeeId: '00503333' },
    { name: '王十二', employeeId: '00507777' },
    { name: '卫十六', employeeId: '00511111' },
    { name: '杨二十', employeeId: '00515555' },
  ],
  '云与计算业务部': [
    { name: '王五', employeeId: '00507890' },
    { name: '周九', employeeId: '00504444' },
    { name: '冯十三', employeeId: '00508888' },
    { name: '蒋十七', employeeId: '00512222' },
    { name: '朱二一', employeeId: '00516666' },
  ],
};

// 子部门映射
const subDepartments = {
  '质量与流程IT部': ['质量与流程IT部/质量部/测试组', '质量与流程IT部/流程部/优化组', '质量与流程IT部/IT部/开发组'],
  'IT平台服务部': ['IT平台服务部/平台开发部', 'IT平台服务部/平台运维部'],
  '智能汽车解决方案部': ['智能汽车解决方案部/智能驾驶组', '智能汽车解决方案部/智能座舱组'],
  '云与计算业务部': ['云与计算业务部/云计算组', '云与计算业务部/大数据组'],
};

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

// 部门分配：质量与流程IT部占大部分，其他部门占小部分
const departmentDistribution = [
  '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部',
  '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部',
  '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部',
  '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部',
  '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部',
  '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部',
  '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部',
  '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部', '质量与流程IT部',
  'IT平台服务部', 'IT平台服务部', 'IT平台服务部',
  '智能汽车解决方案部', '智能汽车解决方案部',
  '云与计算业务部', '云与计算业务部', '云与计算业务部', '云与计算业务部', '云与计算业务部',
];

// 生成团队成员（同一部门）
function generateTeamMembers(teamIndex, department) {
  const members = [];
  const memberCount = 6 + Math.floor(Math.random() * 7); // 6-12人
  const deptMembers = departmentMembers[department];
  const subDepts = subDepartments[department];
  
  // 主要负责人
  const leader = deptMembers[teamIndex % deptMembers.length];
  members.push({
    name: leader.name,
    employeeId: leader.employeeId,
    department: subDepts[teamIndex % subDepts.length],
    role: '组长'
  });
  
  // 其他成员
  for (let i = 1; i < memberCount; i++) {
    const memberIndex = (teamIndex + i) % deptMembers.length;
    const member = deptMembers[memberIndex];
    
    // 避免重复
    if (!members.find(m => m.employeeId === member.employeeId)) {
      members.push({
        name: member.name,
        employeeId: member.employeeId,
        department: subDepts[(teamIndex + i) % subDepts.length]
      });
    }
  }
  
  return members;
}

// 生成所有团队
const teams = [];
for (let i = 0; i < teamNames.length; i++) {
  const department = departmentDistribution[i];
  const members = generateTeamMembers(i, department);
  
  teams.push({
    id: `team-${String(i + 1).padStart(3, '0')}`,
    name: teamNames[i],
    memberCount: members.length,
    isSelected: false,
    members: members
  });
}

// 输出为TypeScript格式
console.log('teams: [');
teams.forEach((team, idx) => {
  console.log('      {');
  console.log(`        id: '${team.id}',`);
  console.log(`        name: '${team.name}',`);
  console.log(`        memberCount: ${team.memberCount},`);
  console.log(`        isSelected: false,`);
  console.log('        members: [');
  team.members.forEach(m => {
    const roleStr = m.role ? `, role: '${m.role}'` : '';
    console.log(`          { name: '${m.name}', employeeId: '${m.employeeId}', department: '${m.department}'${roleStr} },`);
  });
  console.log('        ],');
  console.log('      },');
});
console.log('    ],');
