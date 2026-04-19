<script setup lang="ts">
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps<{ id: number }>();

const siteId = Number(props.id);

const { results } = useMonitoring();

const data = computed(() => (results.value[siteId] || []).slice().reverse());

const LINE = 'rgb(34 197 94)';
const LINE_FILL = 'rgba(34, 197, 94, 0.08)';
const PT_UP = 'rgb(22 163 74)';
const PT_DEGRADED = 'rgb(245 158 11)';
const PT_DOWN = 'rgb(239 68 68)';

const chartData = computed(() => ({
  labels: data.value.map((d) => {
    const date = new Date(d.checked_at);

    return `${date.getDate()}.${date.getMonth() + 1} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  }),
  datasets: [
    {
      label: 'Response Time (ms)',
      data: data.value.map((d) => d.responseTime),
      borderColor: LINE,
      backgroundColor: LINE_FILL,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: data.value.map((d) =>
        d.status === 'down' ? PT_DOWN : d.status === 'degraded' ? PT_DEGRADED : PT_UP,
      ),
      pointBorderColor: 'transparent',
      tension: 0.3,
      fill: true,
    },
  ],
}));

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(24, 24, 27, 0.92)',
      titleColor: '#fafafa',
      bodyColor: '#e4e4e7',
      padding: 8,
      cornerRadius: 4,
      displayColors: false,
      callbacks: {
        label: (context) => {
          const value = context.raw as number;
          const status = data.value[context.dataIndex]?.status;

          return [`${value} ms`, `Status: ${status}`];
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: {
        callback: (val) => `${val}ms`,
        color: '#71717a',
      },
      title: { display: false },
    },
    x: {
      grid: { display: false },
      ticks: {
        maxRotation: 30,
        autoSkip: true,
        maxTicksLimit: 8,
        color: '#71717a',
      },
    },
  },
  interaction: {
    mode: 'index',
    axis: 'x',
    intersect: false,
  },
}));
</script>

<template>
  <div class="card p-5">
    <h3 class="text-md mb-3 font-semibold">Response Time History</h3>
    <ClientOnly>
      <div class="h-32 w-full md:h-52">
        <Line v-if="data.length" :data="chartData" :options="chartOptions" />
        <div v-else class="flex h-full items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      </div>
    </ClientOnly>
  </div>
</template>
