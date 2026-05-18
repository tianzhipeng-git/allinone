根据 module-architecture.md 模块化设计, 我们开始初始化第一个模块.

首先完成将左侧LeftSideBar做模块启动器的开发, MainWindowContent和RightSidebar内容由模块自己控制.

然后初始化第一个模块: global_todo, 缩写(ModuleId): GTD
场景是这样的 我在本地的各个项目各个目录下 习惯写一个todo.md 维护当前项目的待办事项之类的, 但是我没有一个地方来全局地看到我所有项目下的待办, 所以我们要在这里开发一个小的模块 能够将我本地各个目录下的.MD文件, 注册到这里,进行管理.

- 多级分组管理, Markdown原本的目录信息只是作为一个字段 在这里要在注册的时候创建或选择一个分组 是这里的一个管理概念, 类似"文件夹和文件"
- RightSidebar,展示上述"文件夹和文件"
- MainWindowContent展示md内容, 借助milkdown/crepe库实现对Markdown的所见即所得的查看编辑

注册的信息使用SQLite表存储.
