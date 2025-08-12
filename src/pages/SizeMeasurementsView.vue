<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
    <!-- Columna izquierda: selección de molde con cards -->
    <div class="bg-white shadow-lg rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Seleccionar molde</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="template in templates"
          :key="template.id"
          @click="selectTemplate(template.id)"
          class="cursor-pointer border rounded-lg shadow hover:shadow-lg overflow-hidden transition transform hover:scale-105"
          :class="{
            'border-blue-500 ring-2 ring-blue-300': selectedTemplate === template.id
          }"
        >
          <img :src="template.image" alt="" class="w-full h-28 object-cover" />
          <div class="p-3 text-center font-medium">{{ template.name }}</div>
        </div>
      </div>
    </div>

    <!-- Columna derecha: medidas por talla -->
    <div class="bg-white shadow-lg rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Establecer medidas</h2>

      <table class="w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-2 text-left">Talla</th>
            <th class="p-2 text-left">Alto (cm)</th>
            <th class="p-2 text-left">Ancho (cm)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="size in sizes" :key="size">
            <td class="p-2 font-medium">{{ size }}</td>
            <td class="p-2">
              <input
                v-model="measurements[size].height"
                type="number"
                class="w-full p-1 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                min="0"
              />
            </td>
            <td class="p-2">
              <input
                v-model="measurements[size].width"
                type="number"
                class="w-full p-1 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                min="0"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <button
        @click="saveMeasurements"
        class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
      >
        Guardar medidas
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const templates = [
  { id: 1, name: 'Molde A', image: '/templates/template-a.jpg' },
  { id: 2, name: 'Molde B', image: '/templates/template-b.jpg' },
  { id: 3, name: 'Molde C', image: '/templates/template-c.jpg' },
];

const selectedTemplate = ref<number | null>(null);

const sizes = ['2', '4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const measurements = ref(
  sizes.reduce((acc, size) => {
    acc[size] = { height: '', width: '' };
    return acc;
  }, {} as Record<string, { height: string; width: string }>)
);

function selectTemplate(id: number) {
  selectedTemplate.value = id;
}

function saveMeasurements() {
  if (!selectedTemplate.value) {
    alert('Please select a template first');
    return;
  }
  console.log('Saving measurements:', {
    templateId: selectedTemplate.value,
    data: measurements.value,
  });
  alert('Measurements saved!');
}
</script>
