import * as XLSX from 'xlsx';

// Function to generate a unique ID
const generateUniqueID = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Function to upload images to Cloudinary via Next.js API
const uploadImagesAndGetUrls = async (images) => {
  const imageUrls = [];

  for (const image of images) {
    const { name, dataURL } = image;
    try {
      console.log(`Uploading image to Cloudinary via API: ${name}`);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: dataURL, name }),
      });

      const data = await response.json();
      if (data.success) {
        imageUrls.push(data.url);
        console.log(`Image URL for "${name}": ${data.url}`);
      } else {
        console.error(`Upload failed for "${name}"`, data.error);
      }
    } catch (error) {
      console.error(`Error uploading image "${name}":`, error.message);
    }
  }

  return imageUrls;
};

// Function to add a product to MongoDB
const addProductToFirestore = async (productData, collectionName) => {
  try {
    const { name, price, description, imageUrls, ownerId, category, subcategory } = productData;

    console.log(`Adding product to MongoDB`);
    
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        price,
        description,
        images: imageUrls,
        category: category || collectionName,
        subcategory,
        ownerId,
      }),
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    console.log(`Product "${name}" added successfully`);
    return data.data._id;
  } catch (error) {
    console.error(`Error adding product "${productData.name}":`, error.message);
    throw error;
  }
};


// Function to read Excel file and parse its data
const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      resolve(jsonData);
    };
    reader.onerror = (error) => { reject(error); };
    reader.readAsArrayBuffer(file);
  });
};

const handleBulkUploadFromExcel = async (file) => {
  try {
    const jsonData = await readExcelFile(file);
    await addProductsInBulk(jsonData);
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
};

const addProductsInBulk = async (productsData) => {
  try {
    let successCount = 0;
    for (const productData of productsData) {
      if (!productData.category) continue;
      
      try {
        await addProductToFirestore(productData, productData.category);
        successCount++;
      } catch (error) {
        console.error(`Error adding product "${productData.name}"`, error.message);
      }
    }
    return successCount;
  } catch (error) {
    throw error;
  }
};

// Function to fetch products from MongoDB
const fetchProducts = async () => {
  try {
    const response = await fetch('/api/products');
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    const products = data.data;
    
    // Split for legacy support (mens/womens) and map images to imageUrls
    const men = products.filter(p => p.category.toLowerCase() === 'men' || p.category.toLowerCase() === 'mens').map(p => ({ ...p, id: p._id, subcategory: p.subcategory || 'Jeans', imageUrls: p.images || [] }));
    const women = products.filter(p => p.category.toLowerCase() === 'women' || p.category.toLowerCase() === 'womens').map(p => ({ ...p, id: p._id, subcategory: p.subcategory || 'Jeans', imageUrls: p.images || [] }));
    
    return { men, women };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

const fetchMenProducts = async () => {
  const { men } = await fetchProducts();
  return men;
};

const fetchWomenProducts = async () => {
  const { women } = await fetchProducts();
  return women;
};

// Stub implementations to prevent crashes before full migration
const updateProductsWithId = async () => {};
const updateAllProductsWithIds = async () => {};
const addUserToFirestore = async () => {};
const checkUserExists = async () => false;
const fetchUsers = async () => [];

export {
  addProductToFirestore,
  updateProductsWithId,
  fetchUsers,
  addUserToFirestore,
  updateAllProductsWithIds,
  addProductsInBulk,
  handleBulkUploadFromExcel,
  uploadImagesAndGetUrls,
  fetchProducts
};
