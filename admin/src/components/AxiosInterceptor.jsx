import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import axiosInstance from "../lib/axios";

const AxiosInterceptor = ({ children }) => {
    const { getToken } = useAuth();

    useEffect(() => {
        const interceptor = axiosInstance.interceptors.request.use(
            async (config) => {
                const token = await getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    console.log("AxiosInterceptor: Token attached", config.url);
                } else {
                    console.log("AxiosInterceptor: No token found");
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        return () => axiosInstance.interceptors.request.eject(interceptor);
    }, [getToken]);

    return children;
};

export default AxiosInterceptor;
