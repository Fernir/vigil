<script setup>
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

const props = defineProps({
  data: Array,
});

const chartData = computed(() => ({
  labels: props.data.map((d) => {
    const date = new Date(d.checked_at);
    return `${date.getDate()}.${date.getMonth() + 1}`; // short format "DD.MM"
  }),
  datasets: [
    {
      label: "Load time (ms)",
      data: props.data.map((d) => d.loadTime),
      borderColor: "rgb(14, 165, 233)", // primary-500
      backgroundColor: "rgba(14, 165, 233, 0.05)",
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: "rgb(14, 165, 233)",
      pointBorderColor: "transparent",
      tension: 0.3,
      fill: true,
    },
  ],
}));

const chartOptions = {
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
        color: "#6b7280", // gray-500
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: "rgba(0,0,0,0.05)" },
      ticks: {
        callback: (val) => `${val}ms`,
        color: "#6b7280",
      },
    },
  },
  elements: {
    line: { borderJoinStyle: "round" },
  },
};
</script>

<template>
  <div class="w-full" style="height: 200px">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
