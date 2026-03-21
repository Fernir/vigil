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
  Filler,
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
  Filler,
);

const props = defineProps<{ id: number; height?: number }>();

const siteId = Number(props.id);

const { results } = useMonitoring();

const data = computed(() => (results.value[siteId] || []).slice().reverse());

const chartData = computed(() => ({
  labels: data.value.map((d) => {
    const date = new Date(d.checked_at);
    return `${date.getDate()}.${date.getMonth() + 1} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`; // short format "DD.MM HH:MM"
  }),
  datasets: [
    {
      label: "Response Time (ms)",
      data: data.value.map((d) => d.responseTime),
      borderColor: "rgb(14, 165, 233)", // primary-500
      backgroundColor: "rgba(14, 165, 233, 0.05)",
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: data.value.map((d) =>
        d.status === "down"
          ? "#ef4444"
          : d.status === "degraded"
            ? "#f59e0b"
            : "#3b82f6",
      ),
      pointBorderColor: "transparent",
      tension: 0.3,
      fill: true,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"line">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(0,0,0,0.8)",
      titleColor: "#fff",
      bodyColor: "#ddd",
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
      grid: { color: "rgba(0,0,0,0.05)" },
      ticks: {
        callback: (val) => `${val}ms`,
        color: "#6b7280",
      },
      title: { display: false },
    },
    x: {
      grid: { display: false },
      ticks: {
        maxRotation: 30,
        autoSkip: true,
        maxTicksLimit: 8,
        color: "#6b7280",
      },
    },
  },
  interaction: {
    mode: "index",
    axis: "x",
    intersect: false,
  },
}));
</script>

<template>
  <div :style="{ height: height ? `${height}px` : '300px' }" class="w-full">
    <Line v-if="data.length" :data="chartData" :options="chartOptions" />
    <div
      v-else
      class="h-full flex items-center justify-center text-gray-500 text-sm"
    >
      No data available
    </div>
  </div>
</template>
