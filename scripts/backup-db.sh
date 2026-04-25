#!/bin/bash

# ============================================
# 数据库自动备份脚本
# ============================================
#
# 使用方法:
# 1. 修改下方数据库配置
# 2. 添加到 crontab: crontab -e
#    每天凌晨 2 点备份: 0 2 * * * /var/www/ad-workflow/scripts/backup-db.sh
#
# 备份文件保留 7 天，自动清理旧备份
# ============================================

# 数据库配置
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="ad_workflow"
DB_USER="root"
DB_PASS="你的数据库密码"

# 备份目录
BACKUP_DIR="/var/backups/ad-workflow"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ad_workflow_${DATE}.sql.gz"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "开始备份数据库: $DB_NAME"

# 执行备份
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "备份成功: $BACKUP_FILE"
    echo "文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "备份失败！"
    exit 1
fi

# 清理 7 天前的旧备份
echo "清理旧备份..."
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +7 -delete
echo "完成！当前备份文件数量: $(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)"
