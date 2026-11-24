import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseMealDescription, HOUSEHOLD_UNIT_GRAMS } from './nutritionParser';

describe('Indian Household Serving-Unit Nutrition Parser', () => {
  it('accurately parses "1 katori dal, 2 rotis" into ~300-360 kcal (never 4 kcal)', () => {
    const parsed = parseMealDescription('1 katori dal, 2 rotis');
    assert.equal(parsed.length, 2);

    const dal = parsed[0];
    const roti = parsed[1];

    assert.equal(dal.grams, 150);
    assert.equal(roti.grams, 70);

    const totalCalories = parsed.reduce((sum, item) => sum + item.calories, 0);
    assert.ok(
      totalCalories >= 300 && totalCalories <= 360,
      `Expected 300-360 kcal for 1 katori dal + 2 rotis, got ${totalCalories} kcal`
    );

    const totalProtein = parsed.reduce((sum, item) => sum + item.protein, 0);
    assert.ok(totalProtein >= 12 && totalProtein <= 20, `Expected 12-20g protein, got ${totalProtein}g`);
  });

  it('converts Indian household units to expected gram equivalents', () => {
    assert.equal(HOUSEHOLD_UNIT_GRAMS.katori, 150);
    assert.equal(HOUSEHOLD_UNIT_GRAMS.roti, 35);
    assert.equal(HOUSEHOLD_UNIT_GRAMS.paratha, 75);
    assert.equal(HOUSEHOLD_UNIT_GRAMS.idli, 40);
    assert.equal(HOUSEHOLD_UNIT_GRAMS.dosa, 100);
    assert.equal(HOUSEHOLD_UNIT_GRAMS.cup, 240);
    assert.equal(HOUSEHOLD_UNIT_GRAMS.tbsp, 15);
    assert.equal(HOUSEHOLD_UNIT_GRAMS.tsp, 5);
  });

  it('parses idli, dosa, paratha, eggs, banana, and explicit gram inputs', () => {
    const southIndian = parseMealDescription('3 idlis and 1 dosa');
    assert.equal(southIndian.length, 2);
    assert.equal(southIndian[0].grams, 120); // 3 * 40g
    assert.equal(southIndian[1].grams, 100); // 1 * 100g

    const breakfast = parseMealDescription('2 eggs, 1 banana, 1 cup milk');
    assert.equal(breakfast.length, 3);
    assert.equal(breakfast[0].grams, 110); // 2 * 55g
    assert.equal(breakfast[1].grams, 100); // 1 * 100g
    assert.equal(breakfast[2].grams, 240); // 1 * 240g

    const explicitGrams = parseMealDescription('100g paneer, 1 tsp ghee');
    assert.equal(explicitGrams.length, 2);
    assert.equal(explicitGrams[0].grams, 100);
    assert.equal(explicitGrams[0].calories, 265);
    assert.equal(explicitGrams[1].grams, 5);
    assert.equal(explicitGrams[1].calories, 45);
  });

  it('handles empty or unrecognized strings safely', () => {
    assert.deepEqual(parseMealDescription(''), []);
    assert.deepEqual(parseMealDescription('   '), []);
    assert.deepEqual(parseMealDescription('xyz unknown widget'), []);
  });
});
