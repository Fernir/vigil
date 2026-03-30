<script setup lang="ts">
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, type ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps<{ id: number }>();

const siteId = Number(props.id);

const { speedResults } = useMonitoringStore();

const data = computed(() => (speedResults[siteId] || []).slice().reverse());

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

    return `${date.getDate()}.${date.getMonth() + 1}`; // short format "DD.MM"
  }),
  datasets: [
    {
      ...defaultSettings,
      label: 'DOM loading time (ms)',
      data: data.value.map((d) => d.domContentLoaded ?? 0),
      borderColor: 'rgb(14, 165, 233)',
      backgroundColor: 'rgba(14, 165, 233, 0.05)',
      pointBackgroundColor: 'rgb(14, 165, 233)',
    },
    {
      ...defaultSettings,
      label: 'TTFB (ms)',
      data: data.value.map((d) => d.ttfb ?? 0),
      borderColor: 'orange',
      backgroundColor: 'rgba(14, 165, 233, 0.05)',
      pointBackgroundColor: 'orange',
    },
    {
      ...defaultSettings,
      label: 'Load time (ms)',
      data: data.value.map((d) => d.loadTime ?? 0),
      borderColor: 'orangered',
      backgroundColor: 'rgba(14, 165, 233, 0.05)',
      pointBackgroundColor: 'orangered',
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleColor: '#fff',
      bodyColor: '#ddd',
      padding: 8,
      cornerRadius: 4,
      displayColors: false,
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
        color: '#6b7280', // gray-500
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        callback: (val: number) => `${val}ms`,
        color: '#6b7280',
      },
    },
  },
  elements: {
    line: { borderJoinStyle: 'round' },
  },
} as ChartOptions<'line'>;
</script>

<template>
  <div class="card p-5">
    <h3 class="text-md font-semibold mb-3">Speed Trend</h3>
    <ClientOnly>
      <div class="w-full h-32 md:h-52">
        <Line v-if="data?.length" :data="chartData" :options="chartOptions" />
        <div v-else class="h-full flex items-center justify-center text-gray-500">No data available</div>
      </div>
    </ClientOnly>
  </div>
</template>
