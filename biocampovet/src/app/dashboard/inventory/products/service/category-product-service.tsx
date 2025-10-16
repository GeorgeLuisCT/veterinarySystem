import api from "@/services/api";

export const categoryService = {
  getAll: async () => {
    const res = await api.get("/products/categories");
    return res.data;
  },

  getById: async (id: number) => {
    const res = await api.get("/products/categories/get", {
      params: { id },
    });
    return res.data;
  },

  save: async (categoryData: { name: string }) => {
    const res = await api.post("/products/categories", categoryData);
    return res.data;
  },

  updateName: async (id: number, name: string) => {
    const res = await api.put("/products/categories/update-name", null, {
      params: { id, name },
    });
    return res.data;
  },

  softDelete: async (id: number) => {
    await api.delete("/products/categories/soft", {
      params: { id },
    });
  },

  hardDelete: async (id: number) => {
    await api.delete("/products/categories/hard", {
      params: { id },
    });
  },

  restore: async (id: number) => {
    await api.put("/products/categories/restore", null, {
      params: { id },
    });
  },
};
