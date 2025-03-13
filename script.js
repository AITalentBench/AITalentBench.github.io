/* 切换视图：传入 'index'、'generate' 或 'code' */
function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById('view-' + view).classList.remove('hidden');
  // 如果切换到代码视图，则加载代码
  if (view === 'code') {
    loadCode();
  }
}

/* 平滑滚动到页面内某个区域 */
function scrollToSection(sectionId) {
  const elem = document.getElementById(sectionId);
  if (elem) {
    elem.scrollIntoView({ behavior: 'smooth' });
  }
}

/* 控制子导航栏显示与隐藏 */
function toggleSubNav() {
  const subNav = document.getElementById('sub-navbar');
  if (subNav.classList.contains('hidden')) {
    subNav.classList.remove('hidden');
  } else {
    subNav.classList.add('hidden');
  }
}

function hideSubNav() {
  document.getElementById('sub-navbar').classList.add('hidden');
}

/* 模块内容映射 */
const mapping = {
  "capsule-title": "Title.txt",
  "overview": "Overview.txt",
  "task": "Task.txt",
  "key_dates": "Key dates.txt",
  "registration": "Registration.txt",
  "prizes": "Prizes.txt",
  "organizers": "Organizers.txt",
  "contact": "Contact.txt",
  "acknowledgement": "Acknowledgement.txt",
  "evaluation_criteria": "Evaluation Criteria.txt",
  "references": "References.txt",
  "terms_and_conditions": "Terms and Conditions.txt",
  "honor_codes": "Honor codes.txt"
};

/* 加载各模块内容，从后端接口获取生成的结果 */
async function loadContent() {
  try {
    // 调用后端接口获取所有结果数据
    const response = await fetch('https://aitalentbench-b8395f5c2bf5.herokuapp.com/api/get_results');
    if (!response.ok) {
      console.warn(`Failed to load results from backend: HTTP ${response.status}`);
      return;
    }
    const data = await response.json();
    if (data.status !== 'success') {
      console.error(`Backend error: ${data.message}`);
      return;
    }
    const results = data.results;  // 结果对象的键为文件名，例如 "Title.txt"
    // 根据 mapping 更新页面中的内容
    for (const [elemId, fileName] of Object.entries(mapping)) {
      const content = results[fileName];
      if (content !== undefined) {
        if (elemId === "capsule-title") {
          const titleElem = document.getElementById(elemId);
          if (titleElem) titleElem.textContent = content;
        } else {
          const sectionElem = document.querySelector(`#${elemId} p`);
          if (sectionElem) sectionElem.textContent = content;
        }
      } else {
        console.warn(`No content found for ${fileName}`);
      }
    }
  } catch (error) {
    console.error("Error loading content from backend:", error);
  }
}


/* 生成代码并显示 Solution 视图 */
async function handleGenerateCode() {
  document.getElementById('code-loading-message').style.display = 'block';
  try {
    const response = await fetch('https://aitalentbench-b8395f5c2bf5.herokuapp.com/api/generate_code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    const data = await response.json();
    if (data.status === 'success') {
      localStorage.setItem('code_example', data.code);
      showView('code');
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error('Error generating code:', err);
    alert('Error generating code, please try again later.');
  } finally {
    document.getElementById('code-loading-message').style.display = 'none';
  }
}

/* 生成 Capsule 内容（来自 Create Capsule 视图） */
async function handleGenerate() {
  document.getElementById('loading-message-generate').style.display = 'block';
  const orgInfo = document.getElementById('company-info-generate').value.trim();
  if (!orgInfo) {
    alert('Please enter your organization/company information.');
    document.getElementById('loading-message-generate').style.display = 'none';
    return;
  }
  try {
    const response = await fetch('https://aitalentbench-b8395f5c2bf5.herokuapp.com/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization: orgInfo })
    });
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    const data = await response.json();
    if (data.status === 'success') {
      localStorage.setItem('capsule_results', JSON.stringify(data.results));
      showView('index');
      loadContent();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error('Error generating content:', err);
    alert('Error generating content, please try again later.');
  } finally {
    document.getElementById('loading-message-generate').style.display = 'none';
  }
}

/* 加载代码（用于 Solution 视图） */
async function loadCode() {
  try {
    // 调用后端接口获取所有生成结果
    const response = await fetch('https://aitalentbench-b8395f5c2bf5.herokuapp.com/api/get_results');
    if (!response.ok) {
      console.error(`Failed to load results from backend: HTTP ${response.status}`);
      return;
    }
    const data = await response.json();
    if (data.status !== 'success') {
      console.error("Backend error:", data.message);
      return;
    }
    // 从返回的结果中取出 "code.txt" 的内容
    const codeContent = data.results["code.txt"];
    if (codeContent) {
      const codeElem = document.getElementById("code-example");
      if (codeElem) {
        codeElem.textContent = codeContent;
      }
    } else {
      console.warn("No code.txt found in backend results.");
    }
  } catch (error) {
    console.error("Error loading code:", error);
  }
}


/* 动态加载公司信息（用于 company_detail.html 页面） */
function loadCompanyInfo() {
  const companyNameElem = document.getElementById("company-name");
  if (!companyNameElem) return; // 如果页面中没有该元素，则不是 company_detail 页面
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get("id") || "";
  if (companyId) {
    // 更新 logo 图片路径
    document.getElementById("company-logo").src = "companies/" + companyId + "/logo.svg";
    // 动态加载描述文件
    fetch("companies/" + companyId + "/description.txt")
      .then(response => response.text())
      .then(text => {
        let name = "";
        let introduction = "";
        const lines = text.split('\n');
        lines.forEach(line => {
          line = line.trim();
          if(line.toLowerCase().startsWith("name:")){
            name = line.substring(5).trim();
          }
          if(line.toLowerCase().startsWith("introduction:")){
            introduction = line.substring(13).trim();
          }
        });
        document.getElementById("company-name").textContent = name || "Company Name";
        document.getElementById("company-description").textContent = introduction || "No description available.";
      })
      .catch(error => {
        console.error("Error loading company description:", error);
        document.getElementById("company-name").textContent = "Company Name";
        document.getElementById("company-description").textContent = "Failed to load description.";
      });
  } else {
    document.getElementById("company-name").textContent = "Company Name";
    document.getElementById("company-description").textContent = "Default company profile.";
  }
}

/* 初始化加载模块内容和公司信息 */
document.addEventListener("DOMContentLoaded", function(){
  loadContent();
  loadCompanyInfo();
});
