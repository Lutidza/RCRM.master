// 📌 Файл: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCategoryItems.ts
// 📌 Версия: 1.0.0
//
// This utility function renders the subcategories and products for a selected catalog category in the Telegram bot.
// It queries the "product-categories" collection for subcategories (where parent_id equals the selected category ID)
// and the "products" collection for products that belong to the selected category (filtered by category_ids).
// Optionally, it applies a location filter (if provided via catalogBlockData.locationFilter).
// The function builds an inline keyboard with buttons for subcategories and products,
// where each subcategory button has callback_data in the format "catalogCategory|<subcategoryId>"
// and each product button has callback_data in the format "catalogProduct|<productId>".
// Finally, it sends a Telegram message with the constructed inline keyboard using HTML formatting.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { Context, SessionFlavor } from 'grammy';

interface SessionData {
  previousMessages: number[];
}

type BotContext = Context & SessionFlavor<SessionData>;

export async function renderCategoryItems(
  ctx: BotContext,
  categoryId: string,
  catalogBlockData: any,
  payload: Payload
): Promise<void> {
  try {
    // Prepare filter for subcategories: select categories where parent_id equals the selected category ID.
    const subcategoriesFilter = { parent_id: { equals: categoryId } };

    // Query subcategories from the "product-categories" collection.
    const subcategoriesResult = await payload.find({
      collection: 'product-categories',
      where: subcategoriesFilter,
      sort: 'name',
      limit: 999,
    });
    const subcategories = subcategoriesResult.docs;

    // Prepare filter for products belonging to the selected category.
    // Assuming each product has an array field "category_ids".
    let productsFilter: any = {
      category_ids: { in: [categoryId] },
    };

    // If a location filter is specified in the catalog block settings, add it to the product filter.
    if (catalogBlockData && catalogBlockData.locationFilter) {
      productsFilter.locations_ids = { in: [catalogBlockData.locationFilter] };
    }

    // Query products from the "products" collection.
    const productsResult = await payload.find({
      collection: 'products',
      where: productsFilter,
      sort: 'name',
      limit: 999,
    });
    const products = productsResult.docs;

    // Build an inline keyboard with buttons for subcategories and products.
    const keyboard = new InlineKeyboard();

    // Add buttons for subcategories if any are found.
    if (subcategories && subcategories.length > 0) {
      subcategories.forEach((subcat: any, index: number) => {
        // Button text is the subcategory name.
        keyboard.text(subcat.name, `catalogCategory|${subcat.id}`);
        // Optionally, insert a new row after every 2 buttons.
        if ((index + 1) % 2 === 0) {
          keyboard.row();
        }
      });
      // If products are also present, add a new row separator.
      if (products && products.length > 0) {
        keyboard.row();
      }
    }

    // Add buttons for products if any are found.
    if (products && products.length > 0) {
      products.forEach((prod: any) => {
        // Construct button text with product name, price, and size.
        const buttonText = `${prod.name} - ${prod.price}₾ - ${prod.size}`;
        keyboard.text(buttonText, `catalogProduct|${prod.id}`);
        // Place each product button on a new row.
        keyboard.row();
      });
    }

    // If neither subcategories nor products were found, inform the user.
    if ((!subcategories || subcategories.length === 0) && (!products || products.length === 0)) {
      await ctx.reply("Нет подкатегорий или товаров для выбранной категории.", { parse_mode: 'HTML' });
      return;
    }

    // Send the constructed inline keyboard as a message.
    await ctx.reply("Пожалуйста, выберите подкатегорию или товар:", {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
  } catch (error: any) {
    console.error("Error rendering category items:", error);
    await ctx.reply("Произошла ошибка при загрузке данных категории.", { parse_mode: 'HTML' });
  }
}
