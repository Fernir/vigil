<script setup lang="ts">
import { Line } from "vue-chartjs";
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
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const props = defineProps<{ id: number; height?: number }>();

const siteId = Number(props.id);

const { anomalies, fetchAnomalies } = useAnomalies(siteId);

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
        label: "Response Time (ms)",
        data: responseTimes,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        pointRadius: 2, // Smaller points
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "transparent",
        tension: 0.3, // Less tension for performance
        fill: false, // No fill for performance
      },
      {
        label: "Anomalies",
        data: anomalyPoints,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        pointRadius: 4,
        pointBackgroundColor: "#ef4444",
        pointBorderColor: "#ef4444",
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
    legend: { display: true, position: "bottom" },
    tooltip: {
      callbacks: {
        afterLabel: (context) => {
          const data = anomalies.value?.anomalies[context.dataIndex];

          if (data?.isAnomaly) {
            return `Anomaly detected! Z-score: ${data.zScore.toFixed(2)}`;
          }
          return "";
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: "Response Time (ms)" },
    },
  },
} as ChartOptions<"line">;

onMounted(() => {
  fetchAnomalies(siteId);
});
</script>

<template>
  <div class="w-full">
    <div v-if="anomalies" class="overflow-hidden">
      <h3 class="font-semibold mb-2">AI Anomaly Analysis</h3>
      <div class="grid grid-cols-2 gap-4 text-sm pb-4">
        <div class="flex gap-2">
          <span class="text-gray-500">Anomalies detected:</span>
          <span class="font-medium">{{ anomalies.anomalyCount }}</span>
        </div>
        <div class="flex gap-2">
          <span class="text-gray-500">Avg Response Time:</span>
          <span class="font-medium">{{ anomalies.averageResponseTime }}ms</span>
        </div>
        <div class="flex gap-2">
          <span class="text-gray-500">Trend:</span>
          <span
            class="font-medium"
            :class="{
              'text-green-600': anomalies.prediction.trend === 'improving',
              'text-red-600': anomalies.prediction.trend === 'degrading',
              'text-gray-600': anomalies.prediction.trend === 'stable',
            }"
          >
            {{ anomalies.prediction.trend }}
          </span>
        </div>
        <div class="flex gap-2">
          <span class="text-gray-500">Next hour risk:</span>
          <span
            class="font-medium"
            :class="{
              'text-red-600': anomalies.prediction.nextHourRisk > 0.5,
              'text-yellow-600': anomalies.prediction.nextHourRisk > 0.2,
              'text-green-600': anomalies.prediction.nextHourRisk <= 0.2,
            }"
          >
            {{ Math.round(anomalies.prediction.nextHourRisk * 100) }}%
          </span>
        </div>
      </div>
      <ClientOnly>
        <div
          :style="{ height: height ? `${height}px` : '300px' }"
          class="w-full"
        >
          <Line
            :data="chartData"
            :options="chartOptions"
            :height="height ?? 300"
          />
        </div>
      </ClientOnly>
    </div>
    <div v-else class="h-full flex items-center justify-center text-gray-500">
      No anomaly data available
    </div>
  </div>
</template>
