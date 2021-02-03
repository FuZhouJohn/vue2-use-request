<template>
  <div class="hello">
    <ul>
      <li v-for="user in users" :style="{ marginTop: 8 }" :key="user.id">
        <button
          type="button"
          @click="
            () => {
              run(user.id);
            }
          "
          :disabled="fetches[user.id] && fetches[user.id].loading"
        >
          {{
            fetches[user.id] && fetches[user.id].loading
              ? "loading"
              : `delete ${user.username}`
          }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import { ref } from "@vue/composition-api";
import useRequest from "@/tools/useRequest";
export default {
  setup() {
    const { run, loading, fetches } = useRequest(deleteUser, {
      manual: true,
      fetchKey: id => id,
      onSuccess: (result, params) => {
        if (result.success) {
          console.log(`Disabled user ${params[0]}`);
        }
      }
    });
    const users = ref([
      { id: "1", username: "A" },
      { id: "2", username: "B" },
      { id: "3", username: "C" }
    ]);
    return {
      users,
      run,
      fetches,
      loading
    };
  }
};
function deleteUser(userId) {
  console.log(userId);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true });
    }, 1000);
  });
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
