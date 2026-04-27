// src/features/products/api/product-api.ts
import { api } from '@/lib/axios';
import type { PaginatedResponse, Product, ProductQueryParams } from '../types/types';
export const productApi = {
  // Lấy danh sách
  getAll: async () => {
    const response = await api.get('/products');
    return response.data as { result: Product[] };
  },

  create: async ({ productData, files, modelFile }: { productData: any; files?: File[]; modelFile?: File | null }) => {
    const formData = new FormData();

    // 1. Trích xuất và ép kiểu các trường
    const formattedProduct = {
      name: productData.name,
      brand: productData.brand,
      category: productData.category,
      frameType: productData.frameType,
      gender: productData.gender,
      shape: productData.shape,
      frameMaterial: productData.frameMaterial,
      hingeType: productData.hingeType,
      nosePadType: productData.nosePadType,
      weightGram: Number(productData.weightGram || 0),
      status: productData.status || 'ACTIVE',
      imageUrls: Array.isArray(productData.imageUrls) ? productData.imageUrls : [],
    };

    // 2. Append JSON string
    formData.append('product', JSON.stringify(formattedProduct));

    // 3. QUAN TRỌNG: Lặp qua mảng files để append nhiều ảnh (cùng key 'files')
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    // 4. Gửi request
    const response = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.result;
  },

  update: async (id: string, { productData }: { productData: any; files?: File[]; modelFile?: File | null }) => {
    const formattedProduct = {
      name: productData.name,
      brand: productData.brand,
      category: productData.category,
      frameType: productData.frameType,
      gender: productData.gender,
      shape: productData.shape,
      frameMaterial: productData.frameMaterial,
      hingeType: productData.hingeType,
      nosePadType: productData.nosePadType,
      weightGram: Number(productData.weightGram),
      status: productData.status,
      imageUrls: Array.isArray(productData.imageUrls) ? productData.imageUrls : [],
    };

    const response = await api.put(`/products/${id}`, formattedProduct);
    return response.data;
  },
  // Xóa sản phẩm
  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  getFiltered: async (params: ProductQueryParams) => {
    const response = await api.get<PaginatedResponse<Product>>('/products/filter', {
      params: {
        ...params,
        // Đảm bảo default values nếu cần
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    });
    return response.data.result; // Trả về object chứa { items, totalPages, ... }
  },
};
