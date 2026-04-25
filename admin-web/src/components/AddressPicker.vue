<template>
  <div class="address-picker">
    <el-input
      v-model="inputValue"
      type="textarea"
      :rows="2"
      :placeholder="placeholder || '粘贴地图链接自动解析地址'"
      clearable
      @input="onInput"
      @blur="onBlur"
    />
    <!-- 状态提示 -->
    <div v-if="statusText" :class="['parse-status', 'status-' + statusType]">
      <span>{{ statusText }}</span>
      <el-button v-if="parsed" type="primary" size="small" link @click="clearAddress">清除</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const props = defineProps({
  modelValue: [String, Object],
  placeholder: String,
  fieldLabel: String,
})
const emit = defineEmits(['update:modelValue'])

const inputValue = ref('')
const selectedName = ref('')
const parsedAddress = ref({})
const apiKey = ref('')
const statusText = ref('')
const statusType = ref('')
const parsed = ref(false)
let parseTimer = null

async function loadApiKey() {
  try {
    const res = await api.get('/tenant/settings')
    const settings = res.data || {}
    apiKey.value = settings.map_api_key || ''
  } catch {
    apiKey.value = ''
  }
}

function setStatus(text, type) {
  statusText.value = text
  statusType.value = type
}

function onInput(val) {
  clearTimeout(parseTimer)
  const text = (val || '').trim()
  if (!text) {
    clearAddress()
    return
  }
  if (text.includes('http')) {
    setStatus('解析中...', 'loading')
    parseTimer = setTimeout(() => parseShareLink(text), 500)
  } else {
    // 纯文本直接作为地址
    parsed.value = true
    selectedName.value = text
    setStatus('已输入地址', 'success')
    emit('update:modelValue', text)
  }
}

function onBlur() {
  const text = (inputValue.value || '').trim()
  if (text.includes('http') && statusType.value === 'loading') {
    clearTimeout(parseTimer)
    parseShareLink(text)
  }
}

async function parseShareLink(url) {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams

    // 腾讯地图格式: addr=xxx&pointx=xxx&pointy=xxx&name=xxx
    const addrParam = params.get('addr')
    const pointx = params.get('pointx')
    const pointy = params.get('pointy')
    const name = params.get('name')

    if (addrParam) {
      // 优先用 addr 参数（已编码的完整地址），不需要 API Key
      const decodedAddr = decodeURIComponent(addrParam)
      const decodedName = name ? decodeURIComponent(name) : ''
      const address = {
        full_address: decodedAddr,
        title: decodedName || decodedAddr,
        lat: pointy ? parseFloat(pointy) : null,
        lng: pointx ? parseFloat(pointx) : null,
        province: '',
        city: '',
        district: '',
      }
      setSelected(address)
      return
    }

    // 有经纬但没有 addr 参数，需要逆地理编码（需要 API Key）
    if (pointx && pointy) {
      if (!apiKey.value) {
        setStatus('需要配置地图 Key 才能精确解析，请先在系统配置中设置', 'error')
        return
      }
      await reverseGeocode(pointy, pointx, name || '')
      return
    }

    // lat/lng 格式
    if (params.get('lat') && params.get('lng')) {
      if (!apiKey.value) {
        setStatus('需要配置地图 Key 才能精确解析', 'error')
        return
      }
      await reverseGeocode(params.get('lat'), params.get('lng'), params.get('name') || '')
      return
    }

    // 高德 position 格式
    if (params.get('position')) {
      if (!apiKey.value) {
        setStatus('需要配置地图 Key 才能精确解析', 'error')
        return
      }
      const pos = params.get('position').split(',')
      await reverseGeocode(pos[1], pos[0], params.get('name') || '')
      return
    }

    // 短链接
    if (url.includes('j.map.qq.com')) {
      setStatus('短链接需在浏览器中打开后复制完整链接', 'error')
      return
    }

    setStatus('无法识别的链接格式', 'error')
  } catch (e) {
    setStatus('链接格式错误: ' + e.message, 'error')
  }
}

async function reverseGeocode(lat, lng, name) {
  try {
    const res = await fetch(
      `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${apiKey.value}&get_poi=0`
    )
    const data = await res.json()
    if (data.status === 0 && data.result) {
      setSelected({
        full_address: data.result.address || '',
        title: name || data.result.formatted_addresses?.recommend || '',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        province: data.result.address_component?.province || '',
        city: data.result.address_component?.city || '',
        district: data.result.address_component?.district || '',
      })
    } else {
      setStatus('逆地理编码失败', 'error')
    }
  } catch (e) {
    setStatus('请求失败', 'error')
  }
}

function setSelected(address) {
  selectedName.value = address.title || address.full_address
  parsedAddress.value = address
  parsed.value = true
  inputValue.value = address.full_address
  setStatus('已解析: ' + address.full_address, 'success')
  emit('update:modelValue', address)
}

function clearAddress() {
  selectedName.value = ''
  parsedAddress.value = {}
  parsed.value = false
  inputValue.value = ''
  statusText.value = ''
  statusType.value = ''
  emit('update:modelValue', null)
}

onMounted(() => {
  loadApiKey()
})
</script>

<style scoped>
.address-picker { width: 100%; }
.parse-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-top: 4px;
  padding: 2px 0;
}
.status-loading { color: var(--el-text-color-secondary); }
.status-success { color: var(--el-color-success); }
.status-error { color: var(--el-color-danger); }
</style>
