import { PackStateManager } from "@/lib/services/pack-state"
import { validateSamplePack, validateSample } from "@/lib/validations/sample-pack"

export async function testPackStateTransitions(packId: string) {
  const stateManager = new PackStateManager()
  const results = []

  try {
    // Get initial state
    const initialState = await stateManager.getCurrentState(packId)
    results.push({
      step: "Initial State",
      state: initialState,
      success: true
    })

    // Test publishing
    const publishResult = await stateManager.transition(packId, "draft", "published")
    results.push({
      step: "Draft → Published",
      success: publishResult.success,
      error: publishResult.error
    })

    if (publishResult.success) {
      // Test unpublishing
      const unpublishResult = await stateManager.transition(packId, "published", "draft")
      results.push({
        step: "Published → Draft",
        success: unpublishResult.success,
        error: unpublishResult.error
      })

      // Test archiving
      const archiveResult = await stateManager.transition(packId, "published", "archived")
      results.push({
        step: "Published → Archived",
        success: archiveResult.success,
        error: archiveResult.error
      })
    }

    return {
      success: true,
      results
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
      results
    }
  }
}

export function testPackValidation(packData: any) {
  const results = []

  // Test required fields
  const requiredFields = ["title", "description", "genre", "price"]
  for (const field of requiredFields) {
    const testData = { ...packData }
    delete testData[field]
    const result = validateSamplePack(testData)
    results.push({
      test: `Missing ${field}`,
      success: !result.success,
      error: result.error
    })
  }

  // Test invalid values
  const invalidTests = [
    {
      name: "Empty title",
      data: { ...packData, title: "" }
    },
    {
      name: "Negative price",
      data: { ...packData, price: -1 }
    },
    {
      name: "Too long description",
      data: { ...packData, description: "a".repeat(1001) }
    }
  ]

  for (const test of invalidTests) {
    const result = validateSamplePack(test.data)
    results.push({
      test: test.name,
      success: !result.success,
      error: result.error
    })
  }

  return results
}

export function testSampleValidation(sampleData: any) {
  const results = []

  // Test required fields
  const result = validateSample(sampleData)
  results.push({
    test: "Valid sample data",
    success: result.success,
    error: result.error
  })

  // Test invalid BPM
  const invalidBpmTests = [
    { bpm: 0 },
    { bpm: 1000 },
    { bpm: -1 }
  ]

  for (const test of invalidBpmTests) {
    const testData = { ...sampleData, ...test }
    const result = validateSample(testData)
    results.push({
      test: `Invalid BPM: ${test.bpm}`,
      success: !result.success,
      error: result.error
    })
  }

  return results
} 