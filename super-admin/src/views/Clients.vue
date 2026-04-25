<template>
  <div>
    <h1 class="page-title">甲方监管</h1>

    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索甲方名称"
        clearable
        style="width: 200px"
        @change="loadData"
      />
      <el-select
        v-model="tenantFilter"
        placeholder="全部租户"
        clearable
        style="width: 180px"
        @change="loadData"
      >
        <el-option
          v-for="t in tenantList"
          :key="t.id"
          :label="t.name"
          :value="t.id"
        />
      </el-select>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="甲方列表" name="clients">
        <el-table :data="clientList" stripe v-loading="loading">
          <el-table-column prop="name" label="甲方名称" min-width="200" />
          <el-table-column
            prop="tenant_name"
            label="所属租户"
            min-width="200"
          />
          <el-table-column prop="contact_name" label="联系人" width="100" />
          <el-table-column prop="contact_phone" label="联系电话" width="140" />
          <el-table-column label="管理员权限" width="110" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.is_admin"
                size="small"
                @change="toggleClientAdmin(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="row.status === 'active' ? 'success' : 'danger'"
              >
                {{ row.status === "active" ? "正常" : "已暂停" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                size="small"
                @click="showClientDetail(row)"
                >查看</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap" v-if="clientPagination.total > 0">
          <el-pagination
            v-model:current-page="clientPage"
            v-model:page-size="clientPageSize"
            :total="clientPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadData"
            @size-change="
              clientPage = 1;
              loadData();
            "
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="申报监控" name="declarations">
        <el-table :data="declarationList" stripe v-loading="loading">
          <el-table-column prop="client_name" label="甲方名称" width="180" />
          <el-table-column prop="tenant_name" label="所属租户" width="180" />
          <el-table-column prop="work_order_no" label="工单号" width="140" />
          <el-table-column prop="title" label="项目名称" min-width="150" />
          <el-table-column prop="current_stage" label="当前环节" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="stageType(row.current_stage)">{{
                stageLabels[row.current_stage] || row.current_stage
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="提交时间" width="160" />
        </el-table>
        <div class="pagination-wrap" v-if="declPagination.total > 0">
          <el-pagination
            v-model:current-page="declPage"
            v-model:page-size="declPageSize"
            :total="declPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadData"
            @size-change="
              declPage = 1;
              loadData();
            "
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showDialog" title="甲方详情" width="560px">
      <el-descriptions :column="1" border v-if="currentClient">
        <el-descriptions-item label="甲方名称">{{
          currentClient.name
        }}</el-descriptions-item>
        <el-descriptions-item label="所属租户">{{
          currentClient.tenant_name
        }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{
          currentClient.contact_name
        }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{
          currentClient.contact_phone
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag
            size="small"
            :type="currentClient.status === 'active' ? 'success' : 'danger'"
          >
            {{ currentClient.status === "active" ? "正常" : "已暂停" }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getClients, getDeclarations, getTenantList } from "../api/tenants";
import api from "../api";

const activeTab = ref("clients");
const keyword = ref("");
const tenantFilter = ref("");
const showDialog = ref(false);
const currentClient = ref(null);
const loading = ref(false);

const clientList = ref([]);
const declarationList = ref([]);
const tenantList = ref([]);

const clientPage = ref(1);
const clientPageSize = ref(20);
const clientPagination = reactive({ total: 0 });

const declPage = ref(1);
const declPageSize = ref(20);
const declPagination = reactive({ total: 0 });

const stageLabels = {
  declaration: "申报",
  approval: "审批",
  assignment: "待分配",
  measurement: "现场测量",
  design: "设计审核",
  production: "制作",
  construction: "施工阶段",
  finance: "财务",
  archive: "已完工",
  aftersale: "售后",
};

function stageType(s) {
  const map = {
    construction: "success",
    archive: "info",
    assignment: "info",
    declaration: "warning",
    design: "",
    measurement: "",
  };
  return map[s] || "info";
}

async function loadTenants() {
  try {
    const res = await getTenantList({ limit: 100 });
    tenantList.value = res.data?.list || res.data || [];
  } catch {
    tenantList.value = [];
  }
}

async function loadData() {
  loading.value = true;
  try {
    if (activeTab.value === "clients") {
      const res = await getClients({
        keyword: keyword.value || undefined,
        tenant_id: tenantFilter.value || undefined,
        page: clientPage.value,
        limit: clientPageSize.value,
      });
      const list = res.data?.list || res.data || [];
      clientList.value = list.map((c) => ({
        id: c.id,
        name: c.name,
        tenant_name: c.tenant?.name || "",
        contact_name: c.contact_name,
        contact_phone: c.contact_phone,
        status: c.status,
        is_admin: !!c.is_admin,
      }));
      clientPagination.total = res.data?.total || res.pagination?.total || 0;
    } else {
      const res = await getDeclarations({
        page: declPage.value,
        limit: declPageSize.value,
      });
      const list = res.data?.list || res.data || [];
      declarationList.value = list.map((d) => {
        const wo = d.work_order || {};
        return {
          id: d.id,
          client_name: wo.client?.name || "",
          tenant_name: wo.tenant?.name || "",
          work_order_no: wo.work_order_no || "",
          title: wo.title || "",
          current_stage: wo.current_stage || "",
          created_at: d.created_at,
        };
      });
      declPagination.total = res.data?.total || res.pagination?.total || 0;
    }
  } catch (err) {
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
}

function showClientDetail(row) {
  currentClient.value = row;
  showDialog.value = true;
}

async function toggleClientAdmin(row) {
  try {
    await api.put(`/admin/clients/${row.id}/admin`, { is_admin: row.is_admin });
    ElMessage.success(
      `${row.name} 管理员权限已${row.is_admin ? "开启" : "关闭"}`,
    );
  } catch {
    ElMessage.error("设置失败");
    row.is_admin = !row.is_admin;
  }
}

onMounted(async () => {
  await loadTenants();
  loadData();
});
</script>

<style scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
}
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
