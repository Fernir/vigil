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
  type ChartOptions,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const props = defineProps<{ id: number }>();

const siteId = Number(props.id);

const { anomalies, fetchAnomalies } = useAnomalies(siteId);

const MAIN_LINE = 'rgb(34 197 94)';
const MAIN_FILL = 'rgba(34, 197, 94, 0.08)';
const ANOM_PT = 'rgb(239 68 68)';
const ANOM_BORDER = 'rgb(220 38 38)';

const chartData = computed(() => {
  if (!anomalies.value) return { labels: [], datasets: [] };

  const data = anomalies.value.anomalies.slice(-20);
  const labels = data.map((d) => new Date(d.timestamp).toLocaleTimeString());
  const responseTimes = data.map((d) => d.responseTime);
  const anomalyPoints = data.map((d) => (d.isAnomaly ? d.responseTime : null));

  return {
    labels,
    datasets: [
      {
        label: 'Response Time (ms)',
        data: responseTimes,
        borderColor: MAIN_LINE,
        backgroundColor: MAIN_FILL,
        pointRadius: 2,
        pointBackgroundColor: MAIN_LINE,
        pointBorderColor: 'transparent',
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Anomalies',
        data: anomalyPoints,
        borderColor: ANOM_BORDER,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        pointRadius: 4,
        pointBackgroundColor: ANOM_PT,
        pointBorderColor: ANOM_BORDER,
        showLine: false,
        fill: false,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom', labels: { color: '#71717a', usePointStyle: true } },
    tooltip: {
      backgroundColor: 'rgba(24, 24, 27, 0.92)',
      titleColor: '#fafafa',
      bodyColor: '#e4e4e7',
      callbacks: {
        afterLabel: (context) => {
          const row = anomalies.value?.anomalies[context.dataIndex];

          if (row?.isAnomaly) {
            return `Anomaly detected! Z-score: ${row.zScore.toFixed(2)}`;
          }
          return '';
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { color: '#71717a' },
      title: {
        display: true,
        text: 'Response Time (ms)',
        color: '#71717a',
      },
    },
    x: {
      ticks: { color: '#71717a', maxRotation: 45 },
      grid: { display: false },
    },
  },
} as ChartOptions<'line'>;

onMounted(() => {
  fetchAnomalies(siteId);
});

const trendClass = computed(() => {
  const t = anomalies.value?.prediction.trend;

  if (t === 'improving') return 'text-success-600 dark:text-success-400';
  if (t === 'degrading') return 'text-error-600 dark:text-error-400';

  return 'text-muted-foreground';
});

const riskClass = computed(() => {
  const r = anomalies.value?.prediction.nextHourRisk ?? 0;

  if (r > 0.5) return 'font-semibold text-error-600 dark:text-error-400';
  if (r > 0.2) return 'text-warning-600 dark:text-warning-400';

  return 'text-muted-foreground';
});
</script>

<template>
  <div class="card p-5">
    <div class="w-full">
      <div v-if="anomalies" class="overflow-hidden">
        <h3 class="mb-2 font-semibold">AI Anomaly Analysis</h3>
        <div class="grid grid-cols-2 gap-4 pb-4 text-sm">
          <div class="flex gap-2">
            <span class="text-muted-foreground">Anomalies detected:</span>
            <span class="font-medium text-foreground">{{ anomalies.anomalyCount }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-muted-foreground">Avg Response Time:</span>
            <span class="font-medium text-foreground">{{ anomalies.averageResponseTime }}ms</span>
          </div>
          <div class="flex gap-2">
            <span class="text-muted-foreground">Trend:</span>
            <span class="font-medium capitalize" :class="trendClass">
              {{ anomalies.prediction.trend }}
            </span>
          </div>
          <div class="flex gap-2">
            <span class="text-muted-foreground">Next hour risk:</span>
            <span class="font-medium tabular-nums" :class="riskClass">
              {{ Math.round(anomalies.prediction.nextHourRisk * 100) }}%
            </span>
          </div>
        </div>
        <ClientOnly>
          <div class="h-32 w-full md:h-52">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </ClientOnly>
      </div>
      <div v-else class="flex h-full items-center justify-center text-muted-foreground">
        No anomaly data available
      </div>
    </div>
  </div>
</template>
