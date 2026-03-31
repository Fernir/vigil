<script setup>
defineProps({
    error: Object,
});
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-4">
                {{ error?.statusCode || 'Error' }}
            </h1>
            <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">
                {{ error?.message || 'Something went wrong' }}
            </p>
            <UButton to="/" color="primary">Go back home</UButton>
        </div>
    </div>
</template>
