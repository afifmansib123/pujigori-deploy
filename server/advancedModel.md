# Advanced Mongoose Operations Explained

## 1. Database Indexes
```javascript
ProjectSchema.index({ creator: 1, status: 1 });
ProjectSchema.index({ category: 1, status: 1 });
```

**What indexes do:**
- Speed up database queries by creating shortcuts to find data
- Like an index in a book - helps you find information quickly
- The number `1` means ascending order, `-1` means descending

**Example:** When you search for projects by a specific creator with active status, MongoDB can quickly find them instead of scanning every project.

## 2. Text Search Index
```javascript
ProjectSchema.index({
  title: 'text',
  shortDescription: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    shortDescription: 5,
    description: 2,
    tags: 1
  }
});
```

**What this does:**
- Enables full-text search across multiple fields
- Weights determine importance (title is 10x more important than tags)
- Users can search "solar energy" and find projects with those words

## 3. Virtual Properties
```javascript
ProjectSchema.virtual('fundingProgress').get(function() {
  return this.targetAmount > 0 ? Math.round((this.currentAmount / this.targetAmount) * 100) : 0;
});
```

**What virtuals do:**
- Create computed fields that don't exist in the database
- Calculated on-the-fly when you access them
- Save database space by not storing calculated values

**Examples:**
- `fundingProgress`: Calculates percentage (e.g., $500 raised of $1000 target = 50%)
- `daysRemaining`: Calculates days left until project ends
- `projectUrl`: Creates a URL path like `/projects/my-cool-project`

## 4. Pre-save Middleware (Hooks)
```javascript
ProjectSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }
  next();
});
```

**What pre-save hooks do:**
- Run automatically before saving to database
- Perfect for data processing and validation

**This specific hook:**
- Creates URL-friendly slugs from titles
- "My Amazing Project!" becomes "my-amazing-project"
- Only creates slug if one doesn't exist

**Other hooks in your code:**
- Calculate 3% admin fee automatically
- Update project status based on dates and funding

## 5. Instance Methods
```javascript
ProjectSchema.methods.canReceiveDonations = function(): boolean {
  const now = new Date();
  return this.status === ProjectStatus.ACTIVE && 
         now >= this.startDate && 
         now <= this.endDate &&
         this.currentAmount < this.targetAmount &&
         this.isActive;
};
```

**What instance methods do:**
- Add custom functions to individual documents
- Called on specific project instances

**Usage example:**
```javascript
const project = await Project.findById(projectId);
if (project.canReceiveDonations()) {
  // Allow donation
} else {
  // Show "funding closed" message
}
```

## 6. Static Methods
```javascript
ProjectSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    status: ProjectStatus.ACTIVE,
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true
  });
};
```

**What static methods do:**
- Add custom functions to the model itself
- Create reusable queries

**Usage examples:**
```javascript
// Find all active projects
const activeProjects = await Project.findActive();

// Find trending projects
const trending = await Project.findTrending(5);

// Find projects by category
const techProjects = await Project.findByCategory('TECHNOLOGY');
```

## Real-World Benefits

**Performance:**
- Indexes make searches 100x faster on large datasets
- Virtual fields save database storage space

**Code Organization:**
- Instance methods keep logic with the data
- Static methods create reusable queries
- Middleware automates repetitive tasks

**User Experience:**
- Text search lets users find projects easily
- Auto-generated slugs create clean URLs
- Status updates happen automatically

## Simple Analogy
Think of this like a smart filing cabinet:
- **Indexes** are like tabs that help you find files quickly
- **Virtuals** are like calculators that compute values when needed
- **Middleware** are like automatic stamps that process documents
- **Methods** are like specialized tools for working with files