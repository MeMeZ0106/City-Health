import axios from 'axios';

const BASE_URL = 'https://psgc.gitlab.io/api';

export interface Province {
  code: string;
  name: string;
}

export interface CityMun {
  code: string;
  name: string;
}

export interface Barangay {
  code: string;
  name: string;
}

export const getProvinces = async (): Promise<Province[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/provinces/`);
    return response.data.sort((a: Province, b: Province) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
};

export const getCitiesAndMunicipalities = async (provinceCode: string): Promise<CityMun[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/provinces/${provinceCode}/cities-municipalities/`);
    return response.data.sort((a: CityMun, b: CityMun) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching cities/municipalities:', error);
    return [];
  }
};

export const getBarangays = async (cityMunCode: string): Promise<Barangay[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/cities-municipalities/${cityMunCode}/barangays/`);
    return response.data.sort((a: Barangay, b: Barangay) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching barangays:', error);
    return [];
  }
};
