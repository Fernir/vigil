<script setup lang="ts">
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const props = defineProps<{
  data: Array<{ hour: string; avgResponseTime: number; totalChecks: number }>;
  height?: number;
}>();

const chartData = computed(() => ({
  labels: props.data.map((d) => d.hour),
  datasets: [
    {
      label: "Avg Response Time (ms)",
      data: props.data.map((d) => d.avgResponseTime),
      backgroundColor: "rgba(59, 130, 246, 0.8)",
      borderRadius: 4,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"bar">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        afterLabel: (context) => {
          const item = props.data[context.dataIndex];
          return `Total checks: ${item?.totalChecks}`;
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
        text: "Milliseconds",
      },
    },
  },
}));
</script>

<template>
  <div :style="{ height: height ? `${height}px` : '300px' }" class="w-full">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
