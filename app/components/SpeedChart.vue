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

const { speedResults } = useMonitoring();

const data = computed(() => (speedResults.value[siteId] || []).slice().reverse());

const G1 = 'rgb(22 163 74)';
const G2 = 'rgb(245 158 11)';
const G3 = 'rgb(239 68 68)';
const F1 = 'rgba(34, 197, 94, 0.06)';
const F2 = 'rgba(245, 158, 11, 0.06)';
const F3 = 'rgba(239, 68, 68, 0.06)';

const defaultSettings = {
  borderWidth: 2,
  pointRadius: 4,
  pointHoverRadius: 6,
  pointBorderColor: 'transparent',
  tension: 0.3,
  fill: true,
};

const chartData = computed(() => ({
  labels: data.value.map((d) => {
    const date = new Date(d.checked_at as string);

    return `${date.getDate()}.${date.getMonth() + 1}`;
  }),
  datasets: [
    {
      ...defaultSettings,
      label: 'DOM loading time (ms)',
      data: data.value.map((d) => d.domContentLoaded ?? 0),
      borderColor: G1,
      backgroundColor: F1,
      pointBackgroundColor: G1,
    },
    {
      ...defaultSettings,
      label: 'TTFB (ms)',
      data: data.value.map((d) => d.ttfb ?? 0),
      borderColor: G2,
      backgroundColor: F2,
      pointBackgroundColor: G2,
    },
    {
      ...defaultSettings,
      label: 'Load time (ms)',
      data: data.value.map((d) => d.loadTime ?? 0),
      borderColor: G3,
      backgroundColor: F3,
      pointBackgroundColor: G3,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom', labels: { color: '#71717a', usePointStyle: true } },
    tooltip: {
      backgroundColor: 'rgba(24, 24, 27, 0.92)',
      titleColor: '#fafafa',
      bodyColor: '#e4e4e7',
      padding: 8,
      cornerRadius: 4,
      displayColors: true,
      callbacks: {
        label: (ctx) => `${ctx.raw} ms`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
        color: '#71717a',
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: {
        callback: (val: number) => `${val}ms`,
        color: '#71717a',
      },
    },
  },
} as ChartOptions<'line'>;
</script>

<template>
  <div class="card p-5">
    <h3 class="text-md mb-3 font-semibold">Performance History</h3>
    <ClientOnly>
      <div class="h-32 w-full md:h-52">
        <Line v-if="data.length" :data="chartData" :options="chartOptions" />
        <div v-else class="flex h-full items-center justify-center text-muted-foreground">
          No data available
        </div>
      </div>
    </ClientOnly>
  </div>
</template>
