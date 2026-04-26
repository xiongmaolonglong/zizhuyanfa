# 任务 1：创建 ActionMenu 通用组件

**文件：**
- 创建：`presentation/common/ActionMenu.kt`

- [ ] **步骤 1：创建 ActionMenu 组件**

```kotlin
// presentation/common/ActionMenu.kt
package com.banghe.measure.presentation.common

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

data class MenuAction(
    val label: String,
    val icon: ImageVector? = null,
    val onClick: () -> Unit
)

@Composable
fun ActionMenu(
    actions: List<MenuAction>,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    Box(modifier = modifier) {
        IconButton(onClick = { expanded = true }) {
            Icon(
                imageVector = Icons.Default.MoreVert,
                contentDescription = "操作菜单",
                modifier = Modifier.size(20.dp)
            )
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            actions.forEach { action ->
                DropdownMenuItem(
                    text = { Text(action.label) },
                    leadingIcon = action.icon?.let {
                        { Icon(it, contentDescription = null, modifier = Modifier.size(18.dp)) }
                    },
                    onClick = {
                        expanded = false
                        action.onClick()
                    }
                )
            }
        }
    }
}
```

- [ ] **步骤 2：Commit**

```bash
git add presentation/common/ActionMenu.kt
git commit -m "feat: add ActionMenu component for task actions"
```
