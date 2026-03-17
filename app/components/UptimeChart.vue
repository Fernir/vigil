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

const props = defineProps<{
  data: Array<{ checkedAt: string; responseTime: number; status: string }>;
  height?: number;
}>();

const chartData = computed(() => ({
  labels: props.data.map((d) =>
    new Date(d.checkedAt).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }),
  ),
  datasets: [
    {
      label: "Response Time (ms)",
      data: props.data.map((d) => d.responseTime),
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: props.data.map((d) =>
        d.status === "down"
          ? "#ef4444"
          : d.status === "degraded"
            ? "#f59e0b"
            : "#3b82f6",
      ),
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"line">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: "index",
      intersect: false,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || "";
          const value = context.raw as number;
          const status = props.data[context.dataIndex]?.status;
          return [`${label}: ${value}ms`, `Status: ${status}`];
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(0, 0, 0, 0.05)",
      },
      title: {
        display: true,
        text: "Response Time (ms)",
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        maxRotation: 45,
        minRotation: 45,
      },
    },
  },
  interaction: {
    mode: "nearest",
    axis: "x",
    intersect: false,
  },
}));
</script>

<template>
  <div :style="{ height: height ? `${height}px` : '300px' }" class="w-full">
    <Line v-if="data.length" :data="chartData" :options="chartOptions" />
    <div v-else class="h-full flex items-center justify-center text-gray-500">
      No data available
    </div>
  </div>
</template>
