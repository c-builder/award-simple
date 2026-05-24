#!/usr/bin/env python3
import re
import json

# 读取新生成的 teams 数据
with open('new-teams-v2.json', 'r', encoding='utf-8') as f:
    new_teams = json.load(f)

# 将 teams 数据转换为 TypeScript 格式
def team_to_ts(team):
    members_ts = []
    for m in team['members']:
        role_str = f", role: '{m['role']}'" if 'role' in m else ""
        members_ts.append(f"          {{ name: '{m['name']}', employeeId: '{m['employeeId']}', department: '{m['department']}'{role_str} }}")
    
    members_block = ',\n'.join(members_ts)
    
    return f"""      {{
        id: '{team['id']}',
        name: '{team['name']}',
        memberCount: {team['memberCount']},
        isSelected: false,
        members: [
{members_block}
        ],
      }},"""

teams_ts = '\n'.join([team_to_ts(t) for t in new_teams])

# 读取 App.tsx
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到第二个奖项（OCC奖项）的 teams 数组
# 从 "id: '2'" 开始找 teams 数组
pattern = r"(id: '2',\n    title: '2025年OCC委员会2025年4月激励奖项',\n    issuingDepartment: '质量与流程IT质量与运营部',\n    awardType: 'team',\n    recipients: \[\],\n    teams: \[)\n([\s\S]*?)(\],\n    isDefault: true,)"

match = re.search(pattern, content)
if match:
    print(f"Found teams array from position {match.start(2)} to {match.end(2)}")
    # 替换 teams 数组内容
    new_content = content[:match.start(2)] + '\n' + teams_ts + '\n' + content[match.end(2):]
    
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replacement successful!")
else:
    print("Pattern not found!")
    # 尝试打印一些上下文来调试
    idx = content.find("id: '2'")
    if idx >= 0:
        print(f"Found 'id: '2'' at position {idx}")
        print("Context around it:")
        print(content[idx:idx+500])
