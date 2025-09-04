import axios from "axios"

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/auth"
    }
    return Promise.reject(error)
  },
)

// Auth services
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password })
    console.log('Auth Login', response);
    const { token, userData } = response.data.data
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(userData))
    return userData
  },

  register: async (userData: { name: string; email: string; password: string; role: string }) => {
    const response = await api.post("/auth/register", userData)
    const { token, user } = response.data
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    return user
  },

  logout: async () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    return true
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem("token")
    if (!token) return null

    try {
      const response = await api.get("/auth/me")
      return response.data
    } catch (error) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      return null
    }
  },
}

// User services
export const userService = {
  getUsers: async () => {
    const response = await api.get("/users")
    return response.data
  },

  getUserById: async (userId: number) => {
    const response = await api.get(`/users?userId=${userId}`)
    return response.data
  },

  updateUser: async (userId: number, userData: any) => {
    const response = await api.put(`/users/${userId}`, userData)
    return response.data
  },

  deleteUser: async (userId: number) => {
    const response = await api.delete(`/users/${userId}`)
    return response.data
  },
}

// Request services
export const requestService = {
  getRequests: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value as string)
    })

    const response = await api.get(`/customization-requests?${queryParams}`)
    return response.data
  },

  getRequestById: async (requestId: string) => {
    const response = await api.get(`/customization-requests/${requestId}`)
    console.log('getReqById', response)
    return response.data
  },

  createRequest: async (requestData: any) => {
    console.log(requestData, 'api');
    
    // Handle FormData for image uploads
    if (requestData instanceof FormData) {
      // Create a custom axios instance for this request
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          // Don't set Content-Type for FormData - axios will set it correctly
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      };
      
      try {
        const response = await axios.post(`${API_URL}/customization-requests`, requestData, config);
        console.log('requests', response);
        return response.data;
      } catch (error) {
        console.error('Error uploading images:', error);
        throw error;
      }
    } else {
      // Regular JSON request
      const response = await api.post("/customization-requests", requestData);
      console.log('requests', response);
      return response.data;
    }
  },

  updateRequest: async (requestId: string, requestData: any) => {
    const response = await api.put(`/customization-requests/${requestId}`, requestData)
    return response.data
  },

  deleteRequest: async (requestId: number) => {
    const response = await api.delete(`/customization-requests/${requestId}`)
    return response.data
  },
}

export const requestImageService = {
  // GET images for a specific customization request
  getImagesByRequestId: async (requestId: string) => {
    const response = await api.get(`/customization-request-images/${requestId}`)
    return response.data
  },

  // POST a new image URL to a customization request
  addImage: async (data: { request_id: string; image_url: string }) => {
    const response = await api.post("/customization-request-images", data)
    console.log(response);
    return response.data
  },

  // POST a new image file to S3 and associate with a customization request
  uploadImage: async (requestId: string, imageFile: File) => {
    const formData = new FormData()
    formData.append("request_id", requestId)
    formData.append("image", imageFile)

    const response = await api.post("/customization-request-images/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  // DELETE an image by image ID
  deleteImage: async (imageId: string) => {
    const response = await api.delete(`/customization-request-images/${imageId}`)
    return response.data
  },
}


// Proposal services
export const proposalService = {
  getProposals: async (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value as string)
    })

    const response = await api.get(`/designer-proposals?${queryParams}`)
    return response.data
  },

  createProposal: async (proposalData: any) => {
    const response = await api.post("/designer-proposals", proposalData)
    return response.data
  },

  updateProposal: async (proposalId: string, proposalData: any) => {
    const response = await api.put(`/designer-proposals/${proposalId}`, proposalData)
    return response.data
  },
}

// Chat services
export const chatService = {
  getMessages: async (senderId: number, receiverId: number) => {
    const response = await api.get(`/chat?senderId=${senderId}&receiverId=${receiverId}`)
    return response.data
  },

  sendMessage: async (messageData: any) => {
    const response = await api.post("/chat", messageData)
    return response.data
  },
}

export default {
  auth: authService,
  users: userService,
  requests: requestService,
  proposals: proposalService,
  chat: chatService,
}
